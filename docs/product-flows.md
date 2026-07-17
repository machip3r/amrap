# AMRAP — Product flows by user type

> **Canonical for the default SvelteKit app (repo root).** Status labels describe SvelteKit. Layout notes: [`../MIGRATION.md`](../MIGRATION.md). Agent standards: [`../AGENTS.md`](../AGENTS.md). Legacy Next.js lives in [`../amrap-next/`](../amrap-next/).

Reference for design and implementation: **who enters**, **what they see**, **what they do**, and **edge cases**. Complements `README.md` (business rules). This file is the **UI/UX flow** source of truth for SvelteKit.

Locales: `es` (default) · `en`.

**Maintenance:** When code adds/changes/removes a feature, screen, nav item, permission, or redirect, update this file in the **same change** for every affected user type. See `AGENTS.md` → *Product flows*. Keep Playwright under `e2e/` in sync.

**Status labels (SvelteKit)**

| Label | Meaning |
| ----- | ------- |
| **Shipped** | Live in SvelteKit as described |
| **Partial** | UI or backend exists in SvelteKit but incomplete vs the intended flow |
| **Planned** | Documented product intent; not built in SvelteKit (or stub only) |

---

## Surface map (SvelteKit)

| Surface | Who | Typical route | Status | Notes |
| ------- | --- | ------------- | ------ | ----- |
| Marketing | Public | `/[locale]` | Shipped | Landing, pricing, contact |
| Auth | Public / pending | `/login`, `/register` | Shipped | OTP on same routes; no public “confirm email” nav link |
| Onboarding | Owner / provisional | `/onboarding` | Shipped | After register or login without completed setup |
| Profile welcome | Invited staff / trainer / member | `/welcome` | Shipped | After accept + password; blocking until `persons.profile_completed_at` |
| Invite decision | Invited staff / trainer / member | `/invite` | Shipped | Accept or decline; decline → `cancelled` + sign out |
| Invite password | After accept | `/invite/password` | Shipped | Required password before `/welcome` |
| Ops app | Owner, staff, trainer | `/dashboard`, `/timers`, members, plans, … | Shipped | Scoped to active gym (`amrap_gym_id` cookie); dashboard quick actions open unified register dialog |
| Member app | Member | `/me`, `/me/qr`, `/me/classes`, `/me/timers`, `/me/inbox` | Shipped | Requires active non-expired membership |
| Organization / billing | Owner / provisional | `/organization` | Partial | Plan UI + deletion; checkout & add gym coming soon |
| Gym settings | All ops roles | `/settings` | Partial | Everyone: personal nav menu. Owner/provisional: + gym branding |
| Team | — | `/team` | Planned | Stub “coming soon”; real UI is `/staff` + `/trainers` |
| Ops inbox | Staff / owner | — | Planned | Only member inbox exists today |
| Ownership transfer | Provisional → owner | — | Planned | Provisional flag + powers exist; invite/accept UI does not |
| Kiosk fullscreen | Staff / iPad | — | Partial | Check-in works inside ops chrome; dedicated kiosk mode not built |
| Gym / branch switcher | Ops | — | Partial | Cookie + multi-role data exist; no switcher UI |
| Platform admin | AMRAP operator | `/platform/…` | Planned | No routes yet |
| White-label member domain | Member | Gym domain | Planned | Ops branding shipped; member shell still AMRAP |
| E2E (Playwright) | CI / local | `e2e/` | Shipped | Owner + provisional + public suite; port 5173 |

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
- After login / invite confirm: `resolvePostAuthPath` → `/invite` if pending invite → owner `/onboarding` if org creator mid-setup → else `/welcome` if `profile_completed_at` null → else ops `/dashboard` if accepted gym role → else `/me` if accepted active membership → else onboarding.

---

## Permission matrix (shipped)

Code: `lib/auth/permissions.ts`. Provisional owners use `canActAsOwner` → full **OWNER** actions.

| Action | OWNER / provisional | STAFF | TRAINER |
| ------ | ------------------- | ----- | ------- |
| `view_dashboard` | ✓ | ✓ | ✓ |
| `checkin` | ✓ | ✓ | — |
| `use_timers` | ✓ | ✓ | ✓ |
| `manage_members` | ✓ | ✓ | — |
| `manage_plans` | ✓ | ✓ | — |
| `manage_classes` | ✓ | ✓ | ✓ (own classes; self as coach) |
| `record_payment` | ✓ | ✓ | — |
| `manage_staff` | ✓ | — | — |
| `manage_billing` | ✓ | — | — |

Granular `gym_roles.permissions` JSON: **Planned** (unused in UI today).

---

## 1. Public and auth

### 1.1 Landing (`/[locale]`) — Shipped

**UI:** Hero (brand-first, gym-floor value) → audience strip → differentiators + daily product → how-it-works (4 steps) → pricing (monthly/annual) → FAQ → contact → final CTA band → footer.

**Positioning:** Ops software for gyms (boxes, functional, strength, combat, boutique) — one QR / many roles, org-pays billing, honest freemium. Not boutique CRM / FitCoins / fiscal-invoice marketing.

**CTAs:** Start free → register · Sign in → login · Contact (lead) · Plan cards → register or scroll to contact (Pro).

**Cases:** Visitor; already logged-in visitor (CTAs may deep-link to app).

---

### 1.2 Register — organization — Shipped

**Who:** Future owner or provisional manager.

**Screen:** Organization name · email · password · confirm password. Submit disabled until fields valid.

**Happy path**

1. `signUp` → bootstrap organization (RPC / ensure).
2. If session exists → `/onboarding`.
3. If email confirmation required → pending cookie + OTP UI on the same register route.

**Perf:** Immediate-session register binds `locals.user`, runs org RPC, then redirects straight to `/onboarding` (no post-auth gate waterfall). OTP / email-confirm signup ensures the org then redirects to `/onboarding` the same way. Pending-confirm path runs admin bootstrap and the pending cookie in parallel. Onboarding load resolves invite / invited-ops / onboarding state / workspace in one parallel round.

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

**Post-login destinations** (shared `resolvePostAuthPath`)

| State | Destination |
| ----- | ----------- |
| Email unconfirmed | OTP UI (pending cookie) |
| Pending invite (`invite_status = pending`) | `/invite` |
| Gym workspace + org creator with incomplete onboarding | `/onboarding` |
| Gym / membership, profile incomplete (`profile_completed_at` null) | `/welcome` |
| Gym workspace (owner finished, or invited staff/trainer with profile done) | `/dashboard` |
| No gym role, active membership + profile done | `/me` |
| Otherwise | `/onboarding` |

**Perf:** After password / OTP success, the session user is bound onto `locals` and `resolvePostAuthPath` resolves invite / onboarding / profile / workspace / member gates in one parallel round (not a sequential waterfall). Ops layout loads workspace with those gates on the follow-up GET.

**Guards:** Logged-in users hitting `/login` or `/register` are redirected via the same resolver (proxy no longer hardcodes `/dashboard`).

**Cases:** Invalid credentials · locked account · auth rate limit.

---

### 1.4 Logout / session — Shipped

Clear session + pending cookies. Redirect marketing (or login).

---

## 2. Onboarding (post-register) — Shipped

**Guard:** Only **org creators** mid-setup (`organizationId` + no `onboarding_completed_at`) are forced to `/onboarding`. Invited staff/trainers/members must finish `/invite` (accept/decline) then password before `/welcome`. Completed owner onboarding stamps `persons.profile_completed_at` so owners skip `/welcome`.

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
- Marks onboarding complete → stamps `persons.profile_completed_at` → `/dashboard`.

**Cases:** Mid-flow abandon (resume saved step) · RPC fail (safe message) · Freemium plan limits.

---

## 2a. Invite accept / decline / password — Shipped

**Who:** Staff, trainer, or member after Auth invite or magic-link confirm.

| Route | Purpose |
| ----- | ------- |
| `/[locale]/invite` | “{Gym} invited you as {role}” · Accept · Decline |
| `/[locale]/invite/password` | Set password (min 8, confirm) then continue |

**Happy path:** Email → `/auth/confirm` (invite/magiclink) → `/invite` → Accept → `invite_status=accepted` → `/invite/password` → `/welcome` → `/dashboard` or `/me`.

**Decline:** `invite_status=cancelled` + `invite_responded_at` · sign out · marketing `/[locale]`. Row stays visible in admin lists (Pending / Cancelled / Active badges). Seat limits ignore `cancelled`. Ops / member shells only after `accepted`.

**Guards:** Pending invite blocks ops, member shell, and `/welcome`. Password page requires signed-in + no longer pending.

---

## 2b. Profile welcome (invited users) — Shipped

**Who:** Staff, trainer, or member after accept + password (or any linked person with **accepted** gym role / membership and null `profile_completed_at`), once owner org onboarding is not required.

**Route:** `/[locale]/welcome` (blocking until saved).

| Role | Fields |
| ---- | ------ |
| Staff / Trainer | Date of birth (required) |
| Member | Date of birth · sex · height (cm) · weight (kg) |

**Happy path:** Save → `profile_completed_at` → `resolvePostAuthPath` → `/dashboard` or `/me`.

**Cases:** Validation errors · no person row → fall through resolver · logout from welcome.

---

## 3. Shared ops chrome — Partial

Visible for owner / staff / trainer (after completed onboarding + gym workspace).

| Element | Behavior | Status |
| ------- | -------- | ------ |
| Logo / home | Active gym dashboard (mobile top bar · desktop sidebar) | Shipped |
| Collapsible sidebar (`md+`) | Dashboard · Check-in · Members · Classes · Timers · Trainers · Staff · Plans · Payments | Shipped |
| Mobile bottom tabs (`< md`) | Up to 3 primary destinations (role-filtered) · center **My QR** FAB · **More** | Shipped |
| My QR (mobile FAB) | Shows current user's person QR for self check-in at the desk | Shipped |
| More sheet (mobile) | Full-width bottom sheet: remaining links · Organization · Settings · logout · gym/org label | Shipped |
| Organization (sidebar footer / More) | Owners / provisional only | Shipped |
| Settings (header gear on `md+` · More on mobile) | All ops roles — sections inside are role-gated | Shipped |
| Nav visibility (per user) | If a role has **more than 5** main sections, that user can hide/show optional pages in Settings → My menu (`gym_roles.nav_visibility`). ≤5 sections → all shown, no picker. **Dashboard always visible.** Settings stays for everyone; Organization stays owner-only. | Shipped |
| Theme toggle · logout | Header / sidebar footer / More sheet | Shipped |
| Watermark (“powered by”) | All breakpoints; sits above mobile bottom tabs | Shipped |
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

**UI:** Active members · check-ins today · expiring soon · operational alerts · recent access · quick actions (check-in link · **register dialog** for new member / trainer / staff).

**Register dialog (quick actions):** Shared `RegisterUserDialog` — role-scoped buttons open the same dialog with member (plan + payment) or trainer/staff (invite) forms. Does not navigate to list pages to start create.

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
| Claim profile later | **Shipped** — invite → accept/decline → password → welcome |
| Day-pass / temporary | Same membership flow; short dates / day-pass price on plans |
| Suspend / penalties | **Planned** (phase 2) |

---

### 4.3 Plans (`/plans`) — Shipped

CRUD membership plans at gym level. Price, duration, active/archived. Day-pass price. Freemium: max **2** active plans.

---

### 4.4 Payments (`/payments`) — Shipped (manual)

Register manual payment (cash / transfer, amount, period). Recent list. Member picker seeds a recent subset and searches the server as you type (does not load every membership up front).

**Planned:** Gateway (Mercado Pago / etc.), recurring, failure handling, member portal, CSV export (Starter+).

---

### 4.5 Check-in (`/checkin`) — Partial (core shipped)

See §7. Owner has full staff check-in powers.

---

### 4.6 Classes (`/classes`, `/classes/[sessionId]`) — Shipped

**Catalog:** Create/edit/duplicate classes · assign trainers · schedules.

**Sessions:** Week calendar · session detail · bookings / roster (care badges + express scores) · session check-in.

**Calendar UX:** On phones, days stack as full-width columns (readable session rows). From `md` up, multi-column week grid. Empty weeks still show the full Mon–Sun grid. Trainers default to calendar and see the **gym’s** week sessions (same as staff); Mi Día stays filtered to classes they coach. Managers default to catalog.

**Performance:** Calendar loads week sessions via `list_class_sessions_for_week` (SQL seat counts — no booking-row download). Catalog vs calendar load only the data for the active tab.

**Who:** Owner and staff manage; trainers can participate via check-in / session views per permissions.

*(Previously documented as phase 2; **shipped** in product.)*

---

### 4.7 Team — Staff & trainers — Shipped (split routes)

| Route | Who manages | Flow |
| ----- | ----------- | ---- |
| `/staff`, `/staff/[id]` | Owner / provisional | List · invite · remove staff · seat limits |
| `/trainers`, `/trainers/[id]` | Owner / provisional | List · invite · remove trainers |

**Invite email (trainer / staff)** — Shipped

1. Owner submits register dialog → Auth invite (or magic link if account exists) via Resend + `persons` upsert + `gym_roles` with `invite_status=pending`.
2. Email (“review invitation”) → `/auth/confirm?token_hash=…&type=invite|magiclink&next=/[locale]/invite`.
3. **Already signed in:** confirm skips OTP and uses `resolvePostAuthPath` (lands on `/invite` while pending).
4. **New / signed out:** verify OTP → `/invite` → Accept → password → `/welcome` (DOB) → `/dashboard` (ops chrome; **not** owner onboarding). Decline → cancelled in list · marketing home.

**Cases:** Seat limit · email send failure (role still created; warning) · already on team · expired / used token → `/login`.

**Planned:** Unified `/team` (currently stub), granular permissions UI, branch assignment UI.

---

### 4.8 Settings (`/settings`) — Partial

**Who:** Every ops role with a gym workspace (owner, provisional, staff, trainer).

**Where:** Header gear (`md+`) · More sheet (mobile) · `/settings`. Always in nav (cannot be hidden).

**What (by role):**
1. **Everyone (shipped)** — **My menu** (only when the role has **more than 5** main sections): personal hide/show for optional pages they can access. Roles with ≤5 sections see all of them (no picker). **Dashboard is always visible** and cannot be hidden. Saved on `gym_roles.nav_visibility`. Organization cannot be hidden (when role allows); Settings stays for everyone.
2. **Owner / provisional (`manage_billing`) only** — **Personalization**: logos light/dark + theme palettes (whitelabel gated by plan).

Hiding a nav item is chrome-only for that user; direct URLs still respect page permission guards.

**Planned:** More personal preferences · gym/branch CRUD · device pairing · richer org settings beyond `/organization`.

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

**UI:** Same ops chrome; Settings available (personal menu; no gym branding). **No** Organization / Staff·Trainers management (`manage_staff` / `manage_billing` denied for those).

**Day-to-day:** Dashboard · check-in · members · plans · classes · payments · Settings (my menu).

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
- Ops access: **Mi Día / week home** (next/live class hero · week strip · upcoming) + **Classes** (create/edit with self as coach) + **Timers** (`/timers`: saved routines list, Simple/Complex editor, full-screen run, localStorage) + **Settings** (personal menu; no gym branding).
- Session roster: care badges (medical note · first day · birthday) + express score capture (AMRAP / strength / for time).
- **No** reception check-in page.
- **No** remote wall-screen timer control.
- Create class → always assigned to the signed-in trainer.

**Planned (rich coach product)**

- Exercise library · routines · templates · “open today’s WOD”.
- Announcements to audience.
- Member detail only if member allows or is in their class.
- **Not by default:** org billing · delete gym · general ops inbox.

---

## 9. Member (socio)

### 9.1 Without account (staff-created profile) — Partial

No app login. Manual check-in at reception. Optional invite to register / claim profile.

**Invite email (member)** — Shipped

1. Staff creates membership → Auth invite; membership `invite_status=pending`; `next=/[locale]/invite`.
2. Link → `/auth/confirm` → `/invite` → Accept → password → `/welcome` (DOB, sex, height, weight) → `/me` when membership is active and invite accepted.
3. Decline → `cancelled` (still listed in members) · sign out · marketing home.

### 9.2 With account — Shipped

**Guards:** Linked person + ≥1 **ACTIVE** non-expired membership (`(member)/layout`).

| Route | Flow |
| ----- | ---- |
| `/me` | Memberships list · switch active gym (cookie) |
| `/me/qr` | Full-screen platform QR |
| `/me/classes` | Upcoming · book / waitlist / cancel · attendance history |
| `/me/timers` | Routines list · Simple/Complex create-edit · full-screen run (localStorage templates) |
| `/me/inbox` | Read `inbox_messages` (auto-mark read); e.g. waitlist promotion alerts |

**Header:** Home · Classes · Timers · Inbox · QR · theme · logout.

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
| Timers | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Check-in | ✓ | ✓ | ✓ | — | show QR | — |
| Staff / trainers | ✓ | ✓ | — | — | — | — |
| Organization / billing | ✓ | ✓ | — | — | — | ✓* |
| Settings | ✓ full | ✓ full | limited | limited | — | — |
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
