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
| Marketing | Public | `/[locale]` | Shipped | Landing, pricing, contact · **SEO:** intent-led titles, descriptions, www canonicals, OG, hreflang, JSON-LD, `/sitemap.xml`, `robots.txt`; private app routes `noindex`. **PWA:** installed apps open `/app` (not marketing); standalone visits to landing bounce to `/app` |
| PWA entry | Installed app | `/app` | Shipped | Manifest `start_url`; cold start paints branded splash then `/app/resolve` → dashboard/me/onboarding (signed-in) or login (signed-out) |
| Auth | Public / pending | `/login`, `/register` | Shipped | OTP on same routes; branded Supabase Auth emails in `supabase/templates/` (paste into Dashboard); no public “confirm email” nav link |
| Onboarding | Owner / provisional | `/onboarding` | Shipped | Steps 1–6 (profile → gym → **schedule** → plans → billing → done); optional AMRAP plan + compare; finish starts owner tour |
| Profile welcome | Invited staff / trainer / member | `/welcome` | Shipped | After accept (+ password only if new Auth user); blocking until `persons.profile_completed_at` |
| Invite decision | Invited staff / trainer / member | `/invite` | Shipped | Accept or decline; decline → `cancelled` + sign out |
| Invite password | After accept (new Auth users only) | `/invite/password` | Shipped | Required password for new accounts; skipped when the email already had an AMRAP login |
| No gym access | Signed-in, no gym/membership | `/no-access` | Shipped | Message + logout; not owner onboarding |
| Ops app | Owner, staff, trainer | `/dashboard`, `/timers`, members, plans, … | Shipped | Scoped to active gym (`amrap_gym_id` cookie); dashboard quick actions open unified register dialog; **friendly 404** for missing member/trainer/staff/class/check-in history (`EntityNotFound`); **global 404** for unknown routes (`/+error` + locale `+error`) |
| Gym info | Owner / provisional | `/gym-info` | Shipped | Edit gym name, address, branch name, and weekly schedule (open days + open/close time) |
| Check-in | Staff / kiosk | `/checkin` | Shipped | QR success overlay · **unknown QR** soft overlay + panel (not “access denied”) · history calendar |
| Member app | Member | `/me`, `/me/qr`, `/me/classes`, `/me/timers`, `/me/inbox`, `/me/profile` | Shipped | Ops-parity shell; active membership; gym white-label when plan allows |
| Ops profile | Staff / trainer / owner | `/profile` | Shipped | Avatar → profile; compose for staff/trainer |
| Organization / billing | Owner / provisional | `/organization` | Partial | Checkout + Portal + webhooks shipped (MXN); **E2E hybrid local** (`pnpm test:e2e:billing`); create gym & unpaid grace UX still coming |
| Gym settings | All ops roles | `/settings` | Partial | Everyone: personal nav menu. Owner/provisional: + gym branding |
| Team | — | `/team` | Planned | Stub “coming soon”; real UI is `/staff` + `/trainers` |
| Ownership transfer | Provisional → owner | — | Planned | Provisional flag + powers exist; invite/accept UI does not |
| Kiosk fullscreen | Staff / iPad | `/checkin` → **Kiosk mode** | Partial | Hides ops chrome; scan + search; check-ins tagged `KIOSK`. Branch selector / idle polish still planned |
| Gym / branch switcher | Ops | — | Partial | Cookie + multi-role data exist; no switcher UI |
| Progressive Web App | Ops / member / public | installable shell | Shipped | Manifest + service worker (shell/fonts/images); install & update prompts; Supabase always network-only — not full offline ops |
| Platform admin | AMRAP operator | `/platform/…` | Planned | No routes yet |
| White-label member domain | Member | Gym domain | Planned | Member + ops branding on shared domain shipped; custom gym domain later |
| E2E (Playwright) | CI / local | `e2e/` | Shipped | Owner + provisional + public suite; port 5173 |

---

## Hierarchy the UI must respect

```
AMRAP (platform)
 └── Organization     ← bills AMRAP
      └── Gym(s)      ← one owner per gym; day-to-day ops
           └── Branch ← physical site
```

- **Roles are contextual:** same person can be owner at A, staff at B, member at C — and can hold an ops role **and** an active membership (same or different gym). Same-gym dual link = **two identities** in the picker (ops vs member). At most one ops role per gym.
- **Active gym / identity:** cookie `amrap_context` (`ops:<gymId>` \| `member:<gymId>`) plus compat `amrap_gym_id` / `amrap_member_gym_id`. Identity picker in top header (+ More on mobile) when the user has more than one usable identity. **Shipped.**
- After login / invite confirm: `resolvePostAuthPath` → `/invite` if pending invite → owner `/onboarding` if org creator mid-setup → else `/welcome` if `profile_completed_at` null → else restore last valid **active identity** (fallback: first ops, then member) → else `/no-access`.

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

**UI:** Hero (brand-first, gym-floor value) → audience strip → differentiators + daily product → how-it-works (4 steps) → pricing (monthly/annual + **Compare plans** dialog) → FAQ → contact → final CTA band → footer.

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
| Gym workspace (owner finished, or invited staff/trainer with profile done) | `/dashboard` (or `/me` if last active identity was member) |
| Multiple identities (ops and/or member, any gyms) | Identity picker · `amrap_context` · `/[locale]/context` |
| No gym role, active membership + profile done | `/me` |
| Accepted invitee, profile incomplete | `/welcome` (never owner `/onboarding`) |
| Org creator mid-setup | `/onboarding` |
| Signed in but no gym workspace / active membership | `/no-access` (message + logout) |

**Perf:** After password / OTP success, the session user is bound onto `locals` and `resolvePostAuthPath` resolves invite / onboarding / profile / workspace / member gates in one parallel round (not a sequential waterfall). Ops layout loads workspace with those gates on the follow-up GET.

**Guards:** Logged-in users hitting `/login` or `/register` are redirected via the same resolver (proxy no longer hardcodes `/dashboard`).

**Cases:** Invalid credentials · locked account · auth rate limit.

---

### 1.4 Logout / session — Shipped

Clear session + pending cookies. Redirect marketing (or login).

---

## 2. Onboarding (post-register) — Shipped

**Guard:** Only **org creators** mid-setup (`organizationId` + no `onboarding_completed_at`) are forced to `/onboarding`. Invited staff/trainers/members must finish `/invite` (accept/decline), then password **only if they are a new Auth user**, before `/welcome`. Completed owner onboarding stamps `persons.profile_completed_at` so owners skip `/welcome`.

### Step 1 — You

- Full name.
- Starting role: **Owner** vs **Provisional manager** (full powers until a real owner accepts — transfer UI still **Planned**).
- Sticky **Continue** (and **Back** from later steps); **Logout** fixed in the footer below those actions.

### Step 2 — First gym

- Gym/brand name · optional address (saved on gym + first branch).
- Short location name (branch; default “Principal”).
- Sticky **Back** / **Continue** actions; **Logout** in the fixed footer.
- Freemium: 1 gym / 1 branch — UI does not offer more here. Sets `amrap_gym_id`.

### Step 3 — Schedule (required)

- Weekday toggle group (Mon–Sun), defaults Mon–Fri.
- Open time + close time (`type="time"`), defaults 06:00–22:00.
- Saves `schedule_enabled_days`, `schedule_open_time`, `schedule_close_time` on `gyms` row.
- Editable later via **Gym information** page (`/gym-info`).

### Step 4 — Memberships (optional)

- Text link **Agregar costo de día/visita** / **Set day pass/visit cost** above the list (when unset); form opens under it.
- Saved day pass appears **first** in the list like a membership (edit only) — edit smoothly scrolls to the form and focuses the price input.
- Sticky **Continue** / **Back** / **Logout** in the fixed footer.
- Up to **2** on Freemium (`maxActivePlans`); paid tiers unlock more without leaving onboarding.
- At Freemium limit: **Upgrade** CTA (Embedded Checkout) + **Compare plans** table dialog.

### Step 5 — AMRAP plan (optional)

- Plan cards (Freemium / Starter / Growth / Pro contact) · monthly/annual confirm · Embedded Checkout.
- **Compare all plans** table · **Continue on Free** (`onboarding_billing_done`) skips.
- Successful paid checkout syncs `plan_tier` and advances past this step.

### Step 6 — Done

- Short summary · CTA to dashboard.
- Marks onboarding complete → stamps `persons.profile_completed_at` → `/dashboard?tour=1` (starts owner quickstart).

**Cases:** Mid-flow abandon (resume saved step) · RPC fail (safe message) · Freemium plan limits · Stripe checkout return.

---

## 2.0 Owner quickstart tour — Shipped

**Who:** Owner / provisional (`canActAsOwner`) only.

**What:** Coachmark tour after first onboarding finish (or Settings → Replay). Spotlights dashboard quick actions + primary nav (check-in, members, classes, payments, plans, organization). Dismiss stored in `localStorage` (`amrap-owner-tour-v1`).

---

## 2a. Invite accept / decline / password — Shipped

**Who:** Staff, trainer, or member after Auth invite or magic-link confirm.

| Route | Purpose |
| ----- | ------- |
| `/[locale]/invite` | “{Gym} invited you as {role}” · Accept · Decline |
| `/[locale]/invite/password` | Set password (min 8, confirm) — **new Auth users only** |

**Happy path (new account):** Email → `/auth/confirm` (invite) → `/invite` → Accept → `/invite/password` → `/welcome` → `/dashboard` or `/me`.

**Happy path (existing account):** Email → `/auth/confirm` (magiclink) or already signed in → `/invite` → Accept → skip password → `/welcome` if profile incomplete, else `/dashboard` or `/me`. Invitees never enter owner `/onboarding` or `/auth/ensure-organization`. On Starter+ (white-label), invite / password / welcome use the gym **logo + theme colors** (and branded tab title) when set.

**Decline:** `invite_status=cancelled` + `invite_responded_at` · sign out · marketing `/[locale]`. Row stays visible in admin lists (Pending / Cancelled / Active badges). Seat limits ignore `cancelled`. Ops / member shells only after `accepted`.

**Guards:** Pending invite blocks ops, member shell, and `/welcome`. Password page requires signed-in + no longer pending + new Auth invite (existing accounts are redirected past it). Logout on invite screens only when a session exists.

---

## 2b. Profile welcome (invited users) — Shipped

**Who:** Staff, trainer, or member after accept (and password when the Auth user is new), or any linked person with **accepted** gym role / membership and null `profile_completed_at`, once owner org onboarding is not required.

**Route:** `/[locale]/welcome` (blocking until saved).

| Role | Fields |
| ---- | ------ |
| Staff / Trainer | Date of birth (required; min age **13**) |
| Member | Date of birth (min age **13**) · gender · height (cm) · weight (kg) |

**Happy path:** Save → `profile_completed_at` → `resolvePostAuthPath` → `/dashboard` or `/me`.

**Cases:** Validation errors · no person row → fall through resolver · logout from welcome · after save, member lands on `/me` (gyms SELECT allows membership-linked gyms).

---

## 2c. No gym access — Shipped

**Who:** Signed-in member, trainer, staff, or owner with **no** active gym workspace and **no** active membership (e.g. expired membership, cancelled invite, gym removed).

**Route:** `/[locale]/no-access`

**UI:** Short explanation · **Logout** (required so they can switch accounts). Not owner `/onboarding` — does not bootstrap an organization.

**Guards:** Pending invite → `/invite`. Org creator mid-setup → `/onboarding`. Incomplete profile with a linked gym/membership/invite → `/welcome`. Otherwise stays on `/no-access` until they have access again.

**E2E:** Deferred — needs seeded orphaned accounts (expired membership / cancelled role); covered by redirect unit of the auth resolver + manual check.

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
| Nav visibility (per user) | Temporarily **disabled** in Settings UI (My menu). Backend `gym_roles.nav_visibility` still exists for when re-enabled. | Partial |
| Theme toggle · logout | Header / sidebar footer / More sheet | Shipped |
| **Identity picker** | Top header (+ More) when >1 usable identity (ops role and/or membership, any gyms); sets `amrap_context` + gym cookies via `/[locale]/context` | Shipped |
| Watermark (“powered by”) | Freemium / Starter only (hidden on Growth / Pro); sits above mobile bottom tabs | Shipped |
| Gym selector | Subsumed by identity picker for multi-gym ops | Shipped (picker) |
| Branch selector | Filter attendance / kiosk | **Planned** |
| Limit / unpaid banners | Freemium near 30 members · grace · read-only | **Planned** (limits enforced in actions; no persistent chrome banners) |
| Avatar menu | Profile · my roles · locale | **Planned** (avatar initial only today) |
| Ops Inbox nav | Feedback inbox | **Partial** — gym feedback on Organization; full ops inbox nav planned |
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

**List:** Search · filters (e.g. active / expired) · status · plan · activity · **View all check-ins** (when role can check in) → `/checkin/history`.

**Detail:** Person (name, contact) · memberships at this gym · renew · delete · QR status.

**Create**

1. Create profile (name, contact) — if the email already exists on the platform, **reuse that person** and add a membership at this gym (multi-gym).
2. Optional invite email to create/claim account (or notify an existing AMRAP user).
3. Choose plan · dates.

**Cases**

| Case | UI |
| ---- | -- |
| Freemium 30 active members | Soft block + upgrade messaging (limits) |
| Email already on platform | Shipped — reuse person + new membership (not “email in use”) |
| Already member at this gym | Field error — already has membership here |
| Member without account | Profile-only; optional invite |
| Claim profile later | **Shipped** — invite → accept/decline → password (new users) → welcome |
| Day-pass / temporary | **Shipped** — register member plan select includes day pass / visit when gym price is set (1-day membership + `DAY_PASS` payment) |
| Trial / discount on create or renew | **Shipped** — pricing mode Full / Discount / Trial; trial = `$0` payment + full duration; discount stores catalog `list_amount` |
| Suspend / penalties | **Planned** (phase 2) |

---

### 4.3 Plans (`/plans`) — Shipped

CRUD membership plans at gym level. Price, duration, active/archived. Day-pass price. Freemium: max **2** active plans.

---

### 4.4 Payments (`/payments`) — Shipped (manual)

Register manual payment (cash / transfer). **Pricing modes:** full list price · **discount** (charge less than catalog; stores `list_amount`) · **trial / courtesy** (charge `$0`, still grants plan/day-pass duration). Recent list shows trial / discount badges. Member picker seeds a recent subset and searches the server as you type. Top option in the member search: **Register new member** (when `manage_members`) → create-member dialog → new membership is selected in the payment form.

Same pricing modes on **create member** and **renew**.

**Planned:** Gateway (Mercado Pago / etc.), recurring, failure handling, member portal, CSV export (Starter+).

---

### 4.5 Check-in (`/checkin`) — Partial (core shipped)

See §7. Owner has full staff check-in powers.

---

### 4.6 Classes (`/classes`, `/classes/[sessionId]`) — Shipped

**Catalog:** Create/edit/duplicate classes · optionally assign trainers (or **no trainer**) · schedules.

**Sessions:** Week calendar · session detail (status/capacity hero, book member, roster/waitlist cards with localized status) · bookings / roster (care badges + express scores) · session check-in.

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
4. **New / signed out:** verify OTP → `/invite` → Accept → password **only if new Auth user** → `/welcome` (DOB) → `/dashboard` (ops chrome; **not** owner onboarding). Existing accounts skip password. Decline → cancelled in list · marketing home.

**Cases:** Seat limit · email send failure (role still created; warning) · already on team · expired / used token → `/login`.

**Planned:** Unified `/team` (currently stub), granular permissions UI, branch assignment UI.

---

### 4.8 Settings (`/settings`) — Partial

**Who:** Every ops role with a gym workspace (owner, provisional, staff, trainer).

**Where:** Header gear (`md+`) · More sheet (mobile) · `/settings`. Always in nav (cannot be hidden).

**What (by role):**
1. **Everyone** — **My menu** (nav visibility) is **temporarily disabled** in the UI (backend/action still exist). Re-enable `NavCustomizationForm` on `/settings` when ready.
2. **Owner / provisional (`manage_billing`) only** — **Personalization**: logos light/dark + theme palettes (whitelabel gated by plan).

Hiding a nav item is chrome-only for that user; direct URLs still respect page permission guards.

**Planned:** Re-enable My menu · more personal preferences · gym/branch CRUD · device pairing · richer org settings beyond `/organization`.

---

### 4.9 Organization (`/organization`) — Partial

**Who:** `manage_billing` (owner / provisional).

**UI (shipped):** Gym list first · AMRAP subscription below (separator) · plan rows (Freemium / Starter / Growth / Pro) · whole upgradeable row opens confirm (monthly/annual) → **Embedded Checkout** in a fullscreen in-app dialog (new paid) or Subscriptions API upgrade (existing) · **Manage billing** opens Customer Portal in a **new tab** · Pro / Contact AMRAP goes to landing `#contact`. List prices are **before tax**; Checkout uses **Stripe Tax** (`automatic_tax`) so Mexico **IVA** (and other registered jurisdictions) is added at payment. Collects tax IDs (e.g. RFC) when relevant.

**Hidden for now:** Schedule gym / org deletion (danger zone + delete gym) — flip `showDeletionUi` in `OrganizationClient` when ready.

**Partial / coming soon in UI:** Create additional gym · unpaid grace → Freemium read-only UX · USD prices.

**Webhook:** `POST /api/stripe/webhook` (no locale) syncs `organizations` from Checkout / subscription / invoice events.

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

**UI:** Camera QR scan · keyboard search (name / phone / id) with multi-match pick · large OK / denied result · walk-in enroll into open classes · **Register** opens a role picker (member / trainer / staff by permission) then the matching create dialog · **today’s check-ins** list · **View all check-ins** history (filter by date + user type: members / trainers / staff; profile = right-end icon action) · click member → **month attendance calendar** · **Kiosk mode** button hides sidebar/header/bottom nav for full-screen desk use (records source `KIOSK`; exit returns to normal chrome).

**Not yet:** Branch selector (`p_branch_id` null today) · idle return-to-scan polish as a separate auto-reset timer.

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
- Ops access: **Mi Día / week home** (next/live class hero · week strip · upcoming) + **Classes** (create/edit with self as coach) + **Timers** (`/timers`: list keeps ops shell; opening run/edit hides header/sidebar/bottom tabs for full-viewport use; Simple templates or Complex multi-cycle editor; **per-phase fullscreen editor** for duration · color · start cue; Simple **Repeat** toggle for work/rest sets; total bar uses phase colors; localStorage; **screen wake lock** while on timers; run clock uses wall time and catches up after background/lock) + **Settings** (personal menu; no gym branding).
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

## 9. Member (miembro)

### 9.1 Without account (staff-created profile) — Partial

No app login. Manual check-in at reception. Optional invite to register / claim profile.

**Invite email (member)** — Shipped

1. Staff creates membership → Auth invite; membership `invite_status=pending`; `next=/[locale]/invite`.
2. Link → `/auth/confirm` → `/invite` → Accept → password **only for new Auth users** → `/welcome` (DOB, gender, height, weight) → `/me` when membership is active and invite accepted. Existing accounts skip password.
3. Decline → `cancelled` (still listed in members) · sign out · marketing home.

### 9.2 With account — Shipped

**Guards:** Linked person + ≥1 **ACTIVE** non-expired membership (`me` layout).

| Route | Flow |
| ----- | ---- |
| `/me` | Home · memberships list · switch active gym (cookie) · shortcut cards |
| `/me/qr` | Full-screen platform QR (also center FAB on mobile) |
| `/me/classes` | Upcoming · book / waitlist / cancel · attendance history |
| `/me/timers` | Routines list · Simple (template presets) / Complex (multi-cycle editor) create-edit · per-phase duration/color/cue dialog · Simple Repeat toggle · full-screen run · screen wake lock · wall-clock catch-up after lock |
| `/me/inbox` | Read gym advice (`inbox_messages`); auto-mark read |
| `/me/profile` | Avatar destination · send feedback to gym or AMRAP (`feedback_messages`) |
| Dual-role / multi-gym header | Identity picker when >1 identity (same-gym ops+member or cross-gym) | Shipped |

**Shell:** Ops parity — `md+` sidebar; `<md` bottom tabs (Home · Classes · Timers / Inbox) + center My QR + More; avatar → profile. White-label theme/logo/tab title when active gym plan allows (`canUseWhitelabel`).

**E2E:** Dual identity switch covered in `e2e/owner/identity-switch.spec.ts` (same-gym owner+member and cross-gym owner A + member B).

### 9.3 Planned member features

Privacy settings · announcements · assigned routines · PRs · progress · community · pay membership online · push/WhatsApp.

### 9.4 Multi-membership — Partial

List + gym switch on `/me` shipped. Community gym context / richer multi-gym UX **Planned**. One platform QR; cross-gym cooldown same as ops.

### 9.5 White-label — Partial

Ops + **member shell** branding (logos/theme/tab title/favicon) when plan allows. Invite / password / welcome also branded. Gym custom domain **Planned**.

---

## 9.6 Feedback — Partial

| Who | Compose | Read gym feedback | Read AMRAP feedback |
| --- | ------- | ----------------- | ------------------- |
| Member | `/me/profile` | — | — (future AMRAP admin app) |
| Staff / trainer | `/profile` | — | — |
| Owner / provisional | — | Organization → Feedback | — |

`feedback_messages.target`: `gym` \| `amrap`. RLS: owners/provisional (+ platform admin) select gym rows; platform admin for admin app.

---

## 10. Organization billing (AMRAP ← Org) — Partial

**Who:** Owner / provisional / billing contact.

See §4.9. Paywalls at blocked actions use plan limits (`lib/plans/limits.ts`).

| Case | UI status |
| ---- | --------- |
| Upgrade for limit (30 members, 2 plans, seats) | Partial — Freemium **hard**-stops at 30 actives; Starter soft-warn at ~500, Growth at ~1000 (no block); staff seats **per gym** (Starter 5 · Growth 10/gym ≤ 30 org) |
| Self-serve Checkout (Starter / Growth, MXN monthly/annual) | Shipped — **Embedded Checkout** in PWA + webhooks · **E2E** `pnpm test:e2e:billing` (hybrid local / Stripe test) |
| Upgrade / change plan (existing sub) | Shipped — in-app confirm → Subscriptions API proration · covered in billing E2E |
| Manage payment method / cancel | Shipped — Customer Portal · portal open + cancel→Freemium webhook covered in billing E2E |
| Downgrade confirm | Shipped — in-app change confirm → Subscriptions API · covered in billing E2E |
| More than 3 gyms | Pro contact copy shipped; no self-serve checkout |
| Unpaid | Partial — `PAST_DUE` synced; 3-day grace → Freemium UX Planned |
| Member payment gateway | Partial — marketed as **Beta**; manual cash/SPEI/terminal logging is the shipped path |
| WhatsApp notifications | Planned — expiry + class booking (Twilio / Meta Cloud / Evolution) |

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

### 12.3 Deletion — Partial (UI hidden)

Backend / dialogs for gym / org deletion exist; **UI is off** (`showDeletionUi = false` on `/organization`). Cancel-within-window still available if a gym is already scheduled. Export CSV path **Planned**.

### 12.4 Announcements — Planned

Composer · audience (everyone, class, role, user) · history.

### 12.5 Penalties — Planned

Staff: suspension / fine · visible on member · block check-in if applicable.

### 12.6 Access hardware — Planned (long term)

Readers / turnstiles consume same check-in API; pair devices in gym settings.

### 12.7 Gym landing builder — Planned (late)

Owner publishes gym page (hours, plans, CTA) — not the AMRAP marketing landing.

### 12.8 WhatsApp notifications — Planned

**Who:** Gym owners / members (LatAm retention).

Automatic WhatsApp (Twilio, Meta Cloud API, or Evolution API): membership expiry (“vence en 3 días”), class booking confirmations. Complements email (often ignored in MX). High-priority competitive wedge after billing Beta.

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
7. Payment gateway (**Beta**) + CSV export + **WhatsApp** notifications.
8. Rich coach product + announcements + penalties.
9. White-label custom domain (Growth+) + member community + routines.
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
