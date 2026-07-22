# AMRAP — Database overview

English reference for the Postgres schema (Supabase). Source of truth: migrations under `supabase/migrations/`.

| Migration | Purpose |
| --------- | ------- |
| `001_initial.sql` | Full MVP schema, RLS, RPCs |
| `002_onboarding.sql` | Onboarding columns / RPC refresh + org select policy (upgrade path) |
| `20260716003201_harden_security_definer_grants.sql` | Move RLS helpers to `private`; revoke anon EXECUTE on public RPCs; drop `gym-logos` listing policy |
| `20260721040252_persons_unique_and_auth_cascade.sql` | Unique `persons.email` / `phone` when set; `persons.user_id` `ON DELETE CASCADE` |
| `20260722052641_gyms_select_for_members.sql` | Members can `SELECT` gyms they have a pending/accepted membership at |
| `20260722053822_create_gym_membership_reuse_person.sql` | `create_gym_membership` reuses `persons` by email (multi-gym) |

**Rule:** never edit an applied migration. Append a new timestamped migration instead.

Auth lives in Supabase **`auth.users`**. App tables are in **`public`**.

---

## Mental model

```
auth.users ──────────────────────────────┐
                                         │
persons (global identity + QR) ◄─────────┤ optional user_id
                                         │
organizations (billing account) ◄────────┘ created_by
 └── gyms
      ├── owner_user_id (exactly one OWNER via gym_roles)
      ├── branches
      ├── gym_roles (OWNER | STAFF | TRAINER per user)
      ├── branch_assignments (staff ↔ branch, same gym)
      ├── plans (gym-wide or branch-scoped)
      ├── memberships → persons
      ├── payments → memberships
      ├── check_ins → memberships + persons
      └── feedback_messages
platform_admins → auth.users
```

| Boundary | Table | Meaning |
| -------- | ----- | ------- |
| Billing | `organizations` | Pays AMRAP; one invoice per org |
| Operations | `gyms` | Brand/unit; one owner |
| Place | `branches` | Physical site |
| Identity | `persons` | One human; one `qr_code` platform-wide |
| Access to ops | `gym_roles` | Contextual role at a gym |
| Access to train | `memberships` | Person ↔ gym (unique pair) |

**Users are global; roles and memberships are contextual.** The same `auth.users` row can own gym A, staff gym B, and be a member (via `persons`) at gym C.

---

## Tables

### `persons`

Platform-wide person profile. May exist **without** `user_id` (staff-created member profile until they claim an account).

| Column | Notes |
| ------ | ----- |
| `id` | PK |
| `user_id` | Unique FK → `auth.users`, nullable, **`on delete cascade`** (claimed person + person-scoped rows go with the auth user; unclaimed persons untouched) |
| `full_name` | Required |
| `email`, `phone` | Optional; **unique when present** (`lower(email)`, `phone`); multiple NULLs allowed |
| `date_of_birth` | Optional; invite profile onboarding (staff/trainer/member) |
| `sex` | Optional; `male` \| `female` \| `other` \| `prefer_not` (member profile) |
| `height_cm` / `weight_kg` | Optional numerics with DB range checks (member profile) |
| `profile_completed_at` | Set when invite `/welcome` finishes; also stamped by `onboarding_complete()` for owners |
| `qr_code` | **Unique** credential; default random UUID text |
| `created_at`, `updated_at` | |

Indexes: `user_id`, unique `email` / `phone` (partial), unique `qr_code`.

#### Auth user delete behavior

| FK | On delete | Why |
| -- | --------- | --- |
| `persons.user_id` | **CASCADE** | Remove claimed identity + memberships/check-ins/bookings/inbox via person cascades |
| `gym_roles.user_id`, `branch_assignments.user_id`, `class_trainers.user_id`, `platform_admins.user_id` | **CASCADE** | Drop ops access rows for that account |
| `organizations.created_by`, `gyms.owner_user_id` | **SET NULL** | Keep org/gym; ownership transfer is a separate product flow |
| `payments.recorded_by`, `check_ins.recorded_by`, `class_bookings.booked_by`, care/session `updated_by` / `recorded_by` | **SET NULL** | Preserve audit history |

---

### `organizations`

Billing account for AMRAP.

| Column | Notes |
| ------ | ----- |
| `name` | Display name |
| `plan_tier` | `FREEMIUM` \| `STARTER` \| `GROWTH` \| `PRO` (default Freemium) |
| `stripe_customer_id` | Stripe Customer (`cus_…`) for AMRAP platform subscription; unique when set |
| `stripe_subscription_id` | Active Stripe Subscription (`sub_…`) when on a paid plan |
| `stripe_subscription_status` | Mirror of Stripe `subscription.status` (`active`, `past_due`, `canceled`, …) |
| `billing_interval` | `month` \| `year` for the current paid price |
| `created_by` | Signup user |
| `pending_as_provisional` | Signup/onboarding: acting as provisional owner |
| `onboarding_plans_done` | Step “plans” finished or skipped |
| `onboarding_completed_at` | Null until onboarding done; app guards on this |
| `deleted_at` | Soft delete / retention window |

---

### `gyms`

| Column | Notes |
| ------ | ----- |
| `organization_id` | Cascade delete with org |
| `name` | |
| `owner_user_id` | Convenience pointer; authoritative OWNER is `gym_roles` |
| `logo_url_light` / `logo_url_dark` | Storage object paths in bucket `gym-logos` (e.g. `{gym_id}/logo-light.png`) |
| `theme_light` / `theme_dark` | `jsonb` hex overrides: `primary`, `bg`, `surface` (`{}` = defaults) |
| `address` | Optional general / brand address |
| `deleted_at` | Soft delete |

---

### `branches`

| Column | Notes |
| ------ | ----- |
| `gym_id` | Cascade |
| `name` | Display label for the location (e.g. Principal, Centro) |
| `address` | Optional physical street address |

---

### `gym_roles`

Staff / owner / trainer at a gym. **One row per `(gym_id, user_id)`.**

| Column | Notes |
| ------ | ----- |
| `role` | `OWNER` \| `STAFF` \| `TRAINER` |
| `is_provisional_owner` | Full owner powers until real owner accepts |
| `permissions` | `jsonb` for granular grants (default `{}`) |
| `nav_visibility` | Per-user ops chrome prefs: `{ "hidden": ["timers", "plans", …] }` — empty `{}` = show all role-allowed items. Settings always available; Organization only for owners. |
| `invite_status` | `pending` \| `accepted` \| `cancelled` (team invites; owners are `accepted`) |
| `invite_responded_at` | When invitee accepted or declined |

Constraints:

- Unique index: at most **one** `OWNER` per gym.
- Unique index: at most **one** provisional owner per gym.

---

### `branch_assignments`

Links a user to a branch. Trigger `enforce_branch_assignment_same_gym` requires an existing `gym_roles` row for that branch’s gym.

---

### `plans`

Membership products sold by the gym.

| Column | Notes |
| ------ | ----- |
| `gym_id` | Required |
| `branch_id` | Optional; null = gym-wide |
| `name`, `price`, `duration_days` | `price >= 0`, `duration_days > 0` |
| `is_active` | Soft-archive; Freemium max **2 active** plans (app-enforced) |

Freemium **product** limit (max 2 active plans) is enforced in app code (`lib/plans/limits.ts`), not a DB check.

---

### `memberships`

Person trains at a gym. **Unique `(gym_id, person_id)`.**

| Column | Notes |
| ------ | ----- |
| `branch_id` | Optional home branch |
| `plan_id` | Set null if plan deleted |
| `status` | `ACTIVE` \| `INACTIVE` \| `EXPIRED` \| `CANCELLED` |
| `expires_at` | Required |
| `invite_status` | `pending` \| `accepted` \| `cancelled` (account claim invite) |
| `invite_responded_at` | When member accepted or declined |

---

### `payments`

Ops-recorded payments (cash, transfer, etc.). Gateway / recurring billing is a later layer.

| Column | Notes |
| ------ | ----- |
| `gym_id`, `membership_id` | |
| `amount`, `method` | `CASH` \| `TRANSFER` \| `CARD` \| `OTHER` |
| `recorded_by` | Staff user |

---

### `check_ins`

| Column | Notes |
| ------ | ----- |
| `gym_id`, `branch_id` | |
| `membership_id`, `person_id` | Denormalized person for session queries |
| `source` | `QR` \| `MANUAL` \| `KIOSK` |
| `checked_in_at` | |
| `session_expires_at` | Typically `now() + 4 hours` |
| `recorded_by` | Staff who recorded it |

Anti-abuse is enforced in `record_check_in`: no new check-in at gym B while person has an **active session** (`session_expires_at > now()`) at another gym.

---

### `feedback_messages`

Internal feedback (MVP: text). Members / staff / trainers compose; gym owners (and provisional) read **gym** target; `amrap` target is for the future AMRAP admin app (`platform_admins`).

| Column | Notes |
| ------ | ----- |
| `gym_id` | Active gym context when sent |
| `target` | `gym` \| `amrap` (default `gym`) |
| `body` | 1–4000 chars |
| `author_person_id` | Optional |
| `created_at` | |

**RLS:** Select — platform admin, or (`target = gym` and OWNER / provisional at gym). Insert — gym role or membership at gym (app blocks owner/provisional from composing).

---

### `platform_admins`

AMRAP operator seats (not gym staff).

| Column | Notes |
| ------ | ----- |
| `user_id` | PK → `auth.users` |
| `role` | `OWNER` \| `SUPPORT` \| `SALES` \| `BILLING` |

---

## Enumerations (check constraints)

| Domain | Values |
| ------ | ------ |
| Org plan | `FREEMIUM`, `STARTER`, `GROWTH`, `PRO` |
| Gym role | `OWNER`, `STAFF`, `TRAINER` |
| Membership status | `ACTIVE`, `INACTIVE`, `EXPIRED`, `CANCELLED` |
| Payment method | `CASH`, `TRANSFER`, `CARD`, `OTHER` |
| Check-in source | `QR`, `MANUAL`, `KIOSK` |
| Platform admin role | `OWNER`, `SUPPORT`, `SALES`, `BILLING` |

---

## RPC / functions (security definer)

Public RPCs are granted to `authenticated` only (not `anon` / `PUBLIC`). Prefer these over raw inserts for signup, onboarding, check-in, and member create.

RLS / storage helpers live in schema **`private`** (not exposed via the Data API). Policies and public RPCs call `private.*`. Grant `USAGE` on `private` + `EXECUTE` on helpers to `authenticated` so RLS can evaluate them; they are not reachable at `/rest/v1/rpc/…`.

### Auth helpers (RLS) — `private.*`

| Function | Returns | Use |
| -------- | ------- | --- |
| `private.is_platform_admin()` | boolean | Current user in `platform_admins` |
| `private.user_gym_ids()` | set of uuid | Gyms where user has OWNER or `invite_status=accepted` role |
| `private.has_gym_role(gym_id, roles[])` | boolean | Role match (OWNER or accepted invite); provisional counts as allowed |
| `private.can_manage_gym(gym_id)` | boolean | OWNER or STAFF (or provisional via `has_gym_role`) |
| `private.is_provisional_owner_of_gym(gym_id)` | boolean | Provisional owner flag |
| `private.user_in_organization(org_id)` / `user_can_manage_organization(org_id)` | boolean | Org membership / manage |
| `private.has_linked_membership_at_gym(gym_id)` | boolean | Signed-in person has pending/accepted membership at gym (gyms SELECT for members) |
| `private.person_owned_by_me` / `staff_can_view_person` / `staff_can_manage_person` | boolean | Person access helpers (`staff_can_view_person` includes members at caller’s gyms **and** teammates linked via `gym_roles`) |
| `private.can_manage_gym_branding_storage(object_name)` | boolean | Storage write checks for `gym-logos` |

Bucket `gym-logos` is **public** for object URL reads; there is **no** broad `SELECT` policy on `storage.objects` (avoids listing all files).

### Signup & onboarding

| Function | Behavior |
| -------- | -------- |
| `register_organization_account(name)` | Creates Freemium org + ensures `persons` row for caller; idempotent if org already exists for `created_by` |
| `onboarding_save_profile(full_name, as_provisional?)` | Updates person name; sets org `pending_as_provisional` |
| `onboarding_create_gym(name, branch_name?, gym_address?, branch_address?)` | First gym + branch + optional addresses + `gym_roles` OWNER (or provisional) |
| `onboarding_mark_plans_done()` | Sets `onboarding_plans_done` |
| `onboarding_complete()` | Sets org `onboarding_completed_at` + stamps caller’s `persons.profile_completed_at` |

Legacy wrappers may exist (`register_organization`, `register_tenant`) for older call sites; prefer the onboarding path above.

### Operations

| Function | Behavior |
| -------- | -------- |
| `record_check_in(gym_id, qr?, membership_id?, branch_id?, source?)` | Validates membership ACTIVE + not expired; blocks cross-gym active session; inserts check-in with 4h `session_expires_at` |
| `create_gym_membership(gym_id, full_name, expires_at, …)` | Creates membership; **reuses** existing `persons` by email when present (multi-gym), else inserts a new person |
| `update_gym_branding(gym_id, theme_light?, theme_dark?, logo_url_light?, logo_url_dark?, clear_logo_light?, clear_logo_dark?)` | Owner/provisional: set gym logos and/or light/dark theme jsonb |
| `update_my_nav_visibility(gym_id, nav_visibility)` | Authenticated user: update **their own** `gym_roles.nav_visibility` for that gym (`{ "hidden": string[] }`) |
| `plan_member_counts(gym_id)` | Grouped membership counts per `plan_id` for Plans page |
| `gym_payment_stats(gym_id, month_start, today_start)` | Aggregate payment totals/counts for Payments page stats cards |

### Triggers

| Trigger | Table | Rule |
| ------- | ----- | ---- |
| `branch_assignments_same_gym` | `branch_assignments` | User must have `gym_roles` on that branch’s gym |

---

## Row Level Security (RLS)

All listed `public` tables have RLS enabled. Pattern summary:

| Table | Typical access |
| ----- | -------------- |
| `persons` | Self (`user_id`); staff at gyms where person has a **membership**; staff who share a gym via **`gym_roles`** (teammates); platform admin |
| `organizations` | Creator / gym roles / members with membership at org gym / platform admin |
| `gyms` / `branches` / `plans` / `payments` | Gym roles (accepted); **members** may `SELECT` gyms they have a pending/accepted membership at; platform admin |
| `gym_roles` | Select peers at same gyms; manage if can manage gym / owner |
| `memberships` / `check_ins` | Gym managers; member may see own via person link (per policies) |
| `feedback_messages` | Select: platform admin or gym OWNER/provisional (`target=gym`); insert for authors |
| `platform_admins` | Select self / admins only |

Exact predicates live in `001_initial.sql` (and `002` for org select). Always re-read policies when changing access rules.

**Service role** (`lib/supabase/admin.ts`) bypasses RLS — server-only, never expose to the client.

---

## Soft delete & retention

- `organizations.deleted_at` / `gyms.deleted_at` support scheduled deletion (product: ~30 days + optional CSV export). Hard purge is application/ops work, not fully automated in MVP SQL.
- Cascade FKs remove children when a gym/org row is **hard**-deleted.
- Deleting an **`auth.users`** row cascades claimed `persons` (and person-scoped data) plus ops access (`gym_roles`, etc.); org/gym rows and audit `*_by` columns are preserved (`SET NULL`). See `persons` → *Auth user delete behavior*.

---

## What is *not* in the schema yet (by design)

Expect future migrations for:

- Ownership transfer invites / acceptance audit
- Granular permission templates beyond raw `permissions` jsonb
- Person “claim” / merge when a profile gains `user_id`
- Freemium numeric caps as DB constraints or trigger checks
- Class sessions/schedules → **shipped** (see Classes below)
- Announcements, penalties, routines, community
- Org billing (Stripe Checkout + webhooks sync `plan_tier` / subscription ids on `organizations`), member payment gateway accounts
- Impersonation audit log
- Member white-label / custom domain (gym branding columns exist for admin dashboard)
- Hardware device registry

### Classes (shipped)

| Table | Purpose |
|--------|---------|
| `classes` | Catalog per gym (`name`, `description`, `capacity`, `duration_minutes`, `tags`, `is_active`) |
| `class_trainers` | Trainers assigned to a class |
| `class_schedules` | Recurrence (`none` \| `weekly`), local time, timezone, validity window |
| `class_sessions` | Materialised occurrences (`starts_at`/`ends_at`, capacity, status) |
| `class_bookings` | Reservations (`confirmed` \| `waitlisted` \| `cancelled` \| `attended` \| `no_show`) + waitlist position |
| `person_gym_care` | Coach-facing care note per person at a gym (`medical_note`, PK `gym_id`+`person_id`) |
| `class_session_results` | Express scores per athlete on a session (`amrap` \| `strength` \| `for_time` \| `other`; unique `session_id`+`person_id`) |
| `inbox_messages` | Internal alerts (e.g. waitlist auto-promote) |

**RPCs:** `generate_class_sessions`, `book_class_session`, `cancel_class_booking` (auto-promote + inbox), `set_class_booking_status`, `walk_in_enroll_class_session`, `list_open_class_sessions_for_check_in`, `list_class_sessions_for_week` (week calendar + SQL booking counts), `duplicate_class_to_gym`. Check-in (`record_check_in`) marks matching class attendance.

**Care / scores RLS (MVP):** `person_gym_care` — select for gym roles; manage for gym managers (staff/owner). `class_session_results` — select for gym roles or the athlete’s own person; manage for OWNER/STAFF/TRAINER at the gym.

---

## Local / remote apply

```bash
# Local Supabase
supabase db reset   # applies 001 then 002 on a clean DB
```

Or run `001_initial.sql` then `002_onboarding.sql` in the SQL editor on a **fresh** project. Do not re-apply `001` on a DB that already had an older incompatible `001`.

---

## Related docs

- Product / business rules: [`README.md`](../README.md)
- UI flows by role: [`docs/product-flows.md`](product-flows.md)
