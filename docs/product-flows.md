# AMRAP — Product flows by user type

Reference for design and implementation: **who enters**, **what they see**, **what they do**, and **edge cases**. Complements `README.md` (business rules). This file is the **UI/UX flow** source of truth.

Locales: `es` (default) · `en`.

**Maintenance:** When code adds/changes/removes a feature, screen, nav item, permission, or redirect, update this file in the **same change** for every affected user type. See `AGENTS.md` → *Product flows*.

**Status labels**

| Label | Meaning |
| ----- | ------- |
| **Shipped** | Live in the app as described |
| **Partial** | UI or backend exists but incomplete vs the intended flow |
| **Planned** | Documented product intent; not built (or stub only) |

---

## Surface map

| Surface | Who | Typical route | Status | Notes |
| ------- | --- | ------------- | ------ | ----- |
| Marketing | Public | `/[locale]` | Shipped | Landing, pricing, contact |
| Auth | Public / pending | `/login`, `/register` | Shipped | OTP on same routes; no public “confirm email” nav link |
| Onboarding | Owner / provisional | `/onboarding` | Shipped | After register or login without completed setup |
| Ops app | Owner, staff, trainer | `/dashboard`, members, plans, … | Shipped | Scoped to active gym (`amrap_gym_id` cookie) |
| Member app | Member | `/me`, `/me/qr`, `/me/classes`, `/me/inbox` | Shipped | Requires active non-expired membership |
| Organization / billing | Owner / provisional | `/organization` | Partial | Plan UI + deletion; checkout & add gym coming soon |
| Gym settings | Owner / provisional | `/settings` | Partial | Branding only |
| Team | — | `/team` | Planned | Stub “coming soon”; real UI is `/staff` + `/trainers` |
| Ops inbox | Staff / owner | — | Planned | Only member inbox exists today |
| Ownership transfer | Provisional → owner | — | Planned | Provisional flag + powers exist; invite/accept UI does not |
| Kiosk fullscreen | Staff / iPad | — | Partial | Check-in works inside ops chrome; dedicated kiosk mode not built |
| Gym / branch switcher | Ops | — | Partial | Cookie + multi-role data exist; no switcher UI |
| Platform admin | AMRAP operator | `/platform/…` | Planned | No routes yet |
| White-label member domain | Member | Gym domain | Planned | Ops branding shipped; member shell still AMRAP |

---

## Hierarchy the UI must respect

```
AMRAP (platform)
 └── Organization     ← bills AMRAP
      └── Gym(s)      ← one owner per gym; day-to-day ops
           └── Branch ← physical site
```

- **Roles are contextual:** same person can be owner at A, staff at B, member at C.
- **Active gym:** cookie `amrap_gym_id` (set at onboarding / member gym switch). **Planned:** ops gym + branch switchers in chrome.
- After login: resolve workspace → onboarding if incomplete → ops dashboard if gym role → else `/me` if active member → else onboarding.

---

## Permission matrix (shipped)

Code: `lib/auth/permissions.ts`. Provisional owners use `canActAsOwner` → full **OWNER** actions.

| Action | OWNER / provisional | STAFF | TRAINER |
| ------ | ------------------- | ----- | ------- |
| `view_dashboard` | ✓ | ✓ | ✓ |
| `checkin` | ✓ | ✓ | ✓ |
| `manage_members` | ✓ | ✓ | — |
| `manage_plans` | ✓ | ✓ | — |
| `manage_classes` | ✓ | ✓ | — (view via check-in on sessions) |
| `record_payment` | ✓ | ✓ | — |
| `manage_staff` | ✓ | — | — |
| `manage_billing` | ✓ | — | — |

Granular `gym_roles.permissions` JSON: **Planned** (unused in UI today).

---

## 1. Public and auth

### 1.1 Landing (`/[locale]`) — Shipped

**UI:** Hero with AMRAP brand → product → pricing → contact → footer.

**CTAs:** Start free → register · Sign in → login · Contact (lead).

**Cases:** Visitor; already logged-in visitor (CTAs may deep-link to app).

---

### 1.2 Register — organization — Shipped

**Who:** Future owner or provisional manager.

**Screen:** Organization name · email · password · confirm password. Submit disabled until fields valid.

**Happy path**

1. `signUp` → bootstrap organization (RPC / ensure).
2. If session exists → `/onboarding`.
3. If email confirmation required → pending cookie + OTP UI on the same register route.

**Cases**

| Case | UI |
| ---- | -- |
| Email already registered | Message + link to login |
| Email rate limit | Clear wait / check inbox message |
| OTP pending (cookie) | 6+ digit code; resend; back to login |
| Wrong / expired OTP | Dictionary error; resend |
| Org missing after confirm | `/auth/ensure-organization` / `ensureOrganization` |

**Not:** Generic public “confirm email” link in nav.

---

### 1.3 Login — Shipped

**Screen:** Email · password (show/hide) · gated submit · link to register.

**Post-login destinations** (login actions / page)

| State | Destination |
| ----- | ----------- |
| Email unconfirmed | OTP UI (pending cookie) |
| Gym workspace, onboarding incomplete | `/onboarding` |
| Gym workspace, onboarding complete | `/dashboard` |
| No gym role, active membership | `/me` |
| Otherwise | `/onboarding` |

**Note:** `proxy.ts` currently sends logged-in users hitting `/login` to `/dashboard` (not fully member-aware). Page/actions handle the richer matrix above.

**Cases:** Invalid credentials · locked account · auth rate limit.

---

### 1.4 Logout / session — Shipped

Clear session + pending cookies. Redirect marketing (or login).

---

## 2. Onboarding (post-register) — Shipped

**Guard:** No `onboarding_completed_at` → force `/onboarding` (ops layout). Legacy `/complete-setup` → `/onboarding`.

### Step 1 — You

- Full name.
- Starting role: **Owner** vs **Provisional manager** (full powers until a real owner accepts — transfer UI still **Planned**).
- Continue.

### Step 2 — First gym

- Gym/brand name · optional gym address.
- Short location name (branch; default “Principal”) · optional physical address.
- Freemium: 1 gym / 1 branch — UI does not offer more here. Sets `amrap_gym_id`.

### Step 3 — Packages / memberships (optional)

- What you charge members (e.g. Monthly $500 / 30 days) · or **Skip**.
- Up to **2** packages on Freemium.
- Fields: package name, price, duration in days.

### Step 4 — Done

- Short summary · CTA to dashboard.
- Marks onboarding complete → `/dashboard`.

**Cases:** Mid-flow abandon (resume saved step) · RPC fail (safe message) · Freemium plan limits.

---

## 3. Shared ops chrome — Partial

Visible for owner / staff / trainer (after completed onboarding + gym workspace).

| Element | Behavior | Status |
| ------- | -------- | ------ |
| Logo / home | Active gym dashboard (mobile top bar · desktop sidebar) | Shipped |
| Collapsible sidebar (`md+`) | Dashboard · Check-in · Members · Classes · Trainers · Staff · Plans · Payments | Shipped |
| Mobile bottom tabs (`< md`) | Up to 3 primary destinations (role-filtered) · center **My QR** FAB · **More** | Shipped |
| My QR (mobile FAB) | Shows current user's person QR for self check-in at the desk | Shipped |
| More sheet (mobile) | Full-width bottom sheet: remaining links · Organization · Settings · logout · gym/org label | Shipped |
| Organization (sidebar footer / More) | Owners / provisional only | Shipped |
| Settings (header gear on `md+` · More on mobile) | Owners / provisional — branding | Shipped |
| Theme toggle · logout | Header / sidebar footer / More sheet | Shipped |
| Watermark (“powered by”) | Desktop only (`md+`); hidden on phones to save space | Shipped |
| Gym selector | List gyms where user has ops role | **Planned** (cookie only) |
| Branch selector | Filter attendance / kiosk | **Planned** |
| Limit / unpaid banners | Freemium near 30 members · grace · read-only | **Planned** (limits enforced in actions; no persistent chrome banners) |
| Avatar menu | Profile · my roles · locale | **Planned** (avatar initial only today) |
| Ops Inbox nav | Feedback inbox | **Planned** |
| `/team` | Unified team | **Planned** stub; use Staff + Trainers |

Member-only users without gym role are redirected to `/me` by `(app)/layout`.

---

## 4. Owner (and provisional with owner powers)

**Scope:** One owner per gym. Provisional acts as owner until transfer (**Planned**).

### 4.1 Dashboard (`/dashboard`) — Shipped

**UI:** Active members · check-ins today · expiring soon · operational alerts · recent access · quick actions (new member, check-in, plans, staff).

**Planned:** Multi-gym rollup · billing health · richer trends (Growth+).

---

### 4.2 Members (`/members`, `/members/[id]`) — Shipped

**List:** Search · filters (e.g. active / expired) · status · plan · activity.

**Detail:** Person (name, contact) · memberships at this gym · renew · delete · QR status.

**Create**

1. Create profile (name, contact).
2. Optional invite email to create/claim account.
3. Choose plan · dates.

**Cases**

| Case | UI |
| ---- | -- |
| Freemium 30 active members | Soft block + upgrade messaging (limits) |
| Member without account | Profile-only; optional invite |
| Claim profile later | **Partial** — invite exists; dedicated claim UI **Planned** |
| Day-pass / temporary | Same membership flow; short dates / day-pass price on plans |
| Suspend / penalties | **Planned** (phase 2) |

---

### 4.3 Plans (`/plans`) — Shipped

CRUD membership plans at gym level. Price, duration, active/archived. Day-pass price. Freemium: max **2** active plans.

---

### 4.4 Payments (`/payments`) — Shipped (manual)

Register manual payment (cash / transfer, amount, period). Recent list.

**Planned:** Gateway (Mercado Pago / etc.), recurring, failure handling, member portal, CSV export (Starter+).

---

### 4.5 Check-in (`/checkin`) — Partial (core shipped)

See §7. Owner has full staff check-in powers.

---

### 4.6 Classes (`/classes`, `/classes/[sessionId]`) — Shipped

**Catalog:** Create/edit/duplicate classes · assign trainers · schedules.

**Sessions:** Week calendar · session detail · bookings / roster · session check-in.

**Who:** Owner and staff manage; trainers can participate via check-in / session views per permissions.

*(Previously documented as phase 2; **shipped** in product.)*

---

### 4.7 Team — Staff & trainers — Shipped (split routes)

| Route | Who manages | Flow |
| ----- | ----------- | ---- |
| `/staff`, `/staff/[id]` | Owner / provisional | List · invite · remove staff · seat limits |
| `/trainers`, `/trainers/[id]` | Owner / provisional | List · invite · remove trainers |

**Planned:** Unified `/team` (currently stub), granular permissions UI, branch assignment UI.

---

### 4.8 Settings (`/settings`) — Partial

Gym branding (logos light/dark, theme). Whitelabel gated by plan.

**Planned:** Gym/branch CRUD, device pairing, richer org settings beyond `/organization`.

---

### 4.9 Organization (`/organization`) — Partial

**Who:** `manage_billing` (owner / provisional).

**UI (shipped):** Current plan · Freemium / Starter / Growth / Pro (contact) copy · gym list · schedule/cancel gym or org deletion (30-day retention messaging).

**Partial / coming soon in UI:** Self-serve checkout · create additional gym.

**Planned:** Live invoices · payment method · annual vs monthly toggle · unpaid grace → Freemium read-only UX · pick one editable gym after downgrade.

---

### 4.10 Multi-gym — Partial / Planned

Data model and cookie support multi-gym roles. **UI:** create gym / switcher / aggregated stats still **Planned** (create gym CTA shows coming soon).

---

## 5. Provisional owner → ownership transfer — Partial

**Who:** Staff/manager who registered because the owner was not ready.

**Shipped today**

- Onboarding choice: provisional vs owner.
- `is_provisional_owner` + `canActAsOwner` → full owner powers.
- Nav can label provisional context.

**Planned UI**

- Persistent banner: acting with owner powers until the owner accepts.
- **Invite owner** (email).
- Owner accepts ownership of gym(s).
- Owner chooses what the ex-provisional keeps (near-owner, staff, etc.).
- Banner clears; role updates.

**Cases (planned):** Expired invite · owner declines · owner already has account · multiple gyms in org.

---

## 6. Staff / manager — Shipped

**UI:** Same ops chrome; **no** Organization / Settings / Staff·Trainers management (`manage_staff` / `manage_billing` denied).

**Day-to-day:** Dashboard · check-in · members · plans · classes · payments.

**Cases:** Forbidden page/message · branch-only scope (**Planned**) · gym read-only for unpaid (**Planned** banner; limits exist server-side).

---

## 7. Check-in (MVP core) — Partial

### 7.1 Reception / ops check-in (`/checkin`) — Shipped (in chrome)

**UI:** Camera QR scan · keyboard search (name / phone / id) with multi-match pick · large OK / denied result · walk-in enroll into open classes · register member from result when allowed · **today’s check-ins** list · **View all check-ins** history · click member → **month attendance calendar**.

**Not yet:** Dedicated fullscreen kiosk chrome · branch selector (`p_branch_id` null today) · idle return-to-scan polish as a separate mode.

### 7.2 From member device — Shipped

`/me/qr` — large platform QR. Staff scans at check-in.

### 7.3 Rules in UI — Shipped (server-enforced)

| Rule | Feedback |
| ---- | -------- |
| Check-in OK | Success + time; 4h session |
| QR used at another gym &lt;4h | Anti-abuse block message |
| Inactive / expired membership | Denied + renew path for staff |
| History | Recent access on dashboard / member; Freemium history window per plan limits |

---

## 8. Trainer (coach) — Partial

**Role in code:** `TRAINER`.

**Shipped**

- Invited via `/trainers`.
- Ops access: dashboard + check-in (and class session participation tied to check-in / assignments).
- Can be assigned to classes by owner/staff.

**Planned (rich coach product)**

- Own home: my classes/events · rosters · timers.
- Exercise library · routines · templates (fork owner templates).
- Announcements to audience.
- Member detail only if member allows or is in their class.
- **Not by default:** org billing · delete gym · general ops inbox.

---

## 9. Member (socio)

### 9.1 Without account (staff-created profile) — Partial

No app login. Manual check-in at reception. Optional invite to register / claim profile (**claim UI Planned**).

### 9.2 With account — Shipped

**Guards:** Linked person + ≥1 **ACTIVE** non-expired membership (`(member)/layout`).

| Route | Flow |
| ----- | ---- |
| `/me` | Memberships list · switch active gym (cookie) |
| `/me/qr` | Full-screen platform QR |
| `/me/classes` | Upcoming · book / waitlist / cancel · attendance history |
| `/me/inbox` | Read `inbox_messages` (auto-mark read); e.g. waitlist promotion alerts |

**Header:** Home · Classes · Inbox · QR · theme · logout.

### 9.3 Planned member features

Profile/privacy settings · announcements · assigned routines · PRs · progress · community (leaderboard, streaks, achievements **per gym**) · pay membership online (if gym gateway) · push/WhatsApp.

### 9.4 Multi-membership — Partial

List + gym switch on `/me` shipped. Community gym context / richer multi-gym UX **Planned**. One platform QR; cross-gym cooldown same as ops.

### 9.5 White-label — Partial

Ops branding (logos/theme) shipped for paid-gated settings. Member surface still AMRAP chrome; gym-domain white-label **Planned**.

---

## 10. Organization billing (AMRAP ← Org) — Partial

**Who:** Owner / provisional / billing contact.

See §4.9. Paywalls at blocked actions use plan limits (`lib/plans/limits.ts`).

| Case | UI status |
| ---- | --------- |
| Upgrade for limit (30 members, 2 plans, seats) | Partial — action errors / messages; richer contextual paywalls Planned |
| More than 3 gyms | Pro contact copy shipped; no self-serve checkout |
| Unpaid | Planned — 3-day grace → Freemium; extra gyms read-only; pick one editable gym |
| Downgrade confirm | Planned |
| Member payment gateway | Planned — Starter+ only |

---

## 11. Platform admin — Planned

Separate UI (`/platform`), same design system, global scope.

| Module | Use |
| ------ | --- |
| Orgs / gyms | Search, plan state, limits, flags |
| Subscriptions | Plan changes, cuts, grace |
| Usage | Users, check-ins, growth |
| Support | Internal tickets · **impersonate** org/user (mandatory audit log) |
| Internal team | Support / sales / billing roles (later) |

**Impersonation:** Red banner “Impersonating X” · exit · extra confirm for critical billing (policy).

---

## 12. Cross-cutting flows

### 12.1 Locale / theme — Partial

Theme toggle shipped in app chrome. Locale via URL `/[locale]/…`. In-app locale switcher **Planned**. Preference persistence for locale **Partial**.

### 12.2 Errors and empties — Shipped (pattern)

Dictionary messages (`es`/`en`). Empty states with CTAs (no members → create; no plans → create/skip).

### 12.3 Deletion — Partial

Schedule gym / org deletion from `/organization` with name confirm + retention note. Cancel within window. Export CSV path **Planned** as alternative.

### 12.4 Announcements — Planned

Composer · audience (everyone, class, role, user) · history.

### 12.5 Penalties — Planned

Staff: suspension / fine · visible on member · block check-in if applicable.

### 12.6 Access hardware — Planned (long term)

Readers / turnstiles consume same check-in API; pair devices in gym settings.

### 12.7 Gym landing builder — Planned (late)

Owner publishes gym page (hours, plans, CTA) — not the AMRAP marketing landing.

---

## 13. Role × module matrix (summary)

| Module | Owner | Provisional | Staff | Trainer | Member | Platform |
| ------ | ----- | ----------- | ----- | ------- | ------ | -------- |
| Onboarding org | ✓ | ✓ | — | — | — | — |
| Dashboard ops | ✓ | ✓ | ✓ | ✓ | — | global* |
| Members CRUD | ✓ | ✓ | ✓ | — | — | support* |
| Plans | ✓ | ✓ | ✓ | — | see own | — |
| Payments (manual) | ✓ | ✓ | ✓ | — | pay* | — |
| Classes | ✓ | ✓ | ✓ | partial | book | — |
| Check-in | ✓ | ✓ | ✓ | ✓ | show QR | — |
| Staff / trainers | ✓ | ✓ | — | — | — | — |
| Organization / billing | ✓ | ✓ | — | — | — | ✓* |
| Member `/me` | — | — | — | — | ✓ | — |
| Ops inbox | * | * | * | — | send* | — |
| Ownership transfer | * | * | — | — | — | — |
| Impersonate | — | — | — | — | — | ✓* |

\* = **Planned**. “partial” = limited shipped access.

---

## 14. Suggested build order (updated vs code)

Already ahead of the original list: **classes**, **member `/me`**, **staff/trainers**, **manual payments**, **org deletion UI**.

Remaining priority suggestions:

1. Ops gym switcher + Freemium/unpaid banners.
2. Ownership transfer UI.
3. Billing checkout + create gym (Growth).
4. True kiosk mode + branch on check-in.
5. Ops feedback inbox.
6. Member claim-profile + profile/privacy.
7. Payment gateway + CSV export.
8. Rich coach product + announcements + penalties.
9. White-label member + community + routines.
10. Platform admin + impersonation.

---

## 15. UI principles (reminder)

- Organization = invoice · Gym = operations · Branch = place.
- Global users · contextual roles · **one QR**.
- Freemium proves value; paid unlocks money features and multi-gym (self-serve up to 3; Pro by contact).
- Same visual base for gym ops and (later) platform admin; **scope** changes.
- Copy always i18n; server errors mapped to dictionary.
- One job per screen/section; kiosk should eventually drop dashboard chrome.
- Keep this file synchronized with every product/UI change (`AGENTS.md`).
