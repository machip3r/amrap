# AMRAP

**AMRAP** is a multi-tenant platform for gyms: operations software, member experience, and fitness brand — built so one person can own several gyms, work as staff or coach elsewhere, and train as a member under a single account.

Markets: **Mexico first**, with **United States** supported from the product definition (locales `es` / `en`, dual pricing).

---

## What AMRAP is

There are two sides of the same product and database:

1. **Gym side** — Organizations, gyms, branches, staff, coaches, and members run day-to-day operations (access, memberships, plans, dashboards, and later classes, payments, community, and more).
2. **Platform side** — AMRAP (the business) bills organizations, manages plans and pricing, sees global usage, and supports customers — including secure **impersonation** for support. Today this is a single operator; later it can include internal roles (support, sales, billing).

AMRAP is **software**, a **community layer**, and a **fitness brand**. Member-facing surfaces can be **white-labeled per gym**.

---

## Business hierarchy

```
AMRAP (platform)
 └── Organization          ← billing account (one invoice)
      └── Gym(s)           ← one owner per gym
           └── Branch(es)  ← physical locations
```

| Concept | Meaning |
| -------- | -------- |
| **Organization** | Company or person that pays AMRAP. One organization → many gyms → **one invoice**. |
| **Gym** | A brand/unit under the organization. May share defaults with sibling gyms or override plans, settings, and content per gym (or per branch). |
| **Branch** | A physical site of a gym. Staff can be assigned to one or more branches of the **same** gym. |
| **User** | A single person identity on the platform (one account, one QR). Roles are **links**, not separate people. |

Shared vs local: organizations may share plans, routines, and settings across gyms, and still **edit per gym or per branch** when needed.

---

## People and roles

Base roles are fixed. **Granular permissions** sit on top (e.g. staff with near-owner powers when the owner grants them).

A user may hold **different roles in different places** at once — e.g. owner of two gyms, coach at another, member at another, staff at another.

### Owner

- Registers and manages **one or more gyms** (each gym has exactly **one** owner).
- Sees stats for all or selected gyms.
- Creates staff, manages roles/permissions, membership pricing/plans.
- Can do anything a manager can do at their gyms.
- Later: central routine templates, optional gym landing pages built in AMRAP.
- Holds a **unique platform QR** credential.

### Manager / staff (encargado)

- Day-to-day operations: attendance, live and historical dashboards, access control, renewals, charges, temporary members, feedback inbox, operational alerts.
- Later: parish-style announcements, classes/events, trainer assignment, penalties, more staff invites.
- **Provisional owner:** if staff signs up first (owner not interested yet), they act with **full owner powers** for the organization/gyms until a real owner is invited and **accepts** ownership. The new owner then decides which permissions the former provisional owner keeps.
- Unique platform QR.

### Coach / trainer

- Later phase: classes/events/announcements, routines, exercise library, reusable templates (including **fork** of owner templates), class rosters, timers; member stats/health when allowed (see privacy rules).
- May coach at **multiple gyms**, same organization or not.
- Unique platform QR.

### Member (client)

- Trains at one or more gyms under **one account** and **multiple memberships**.
- Unique platform QR; check-in validates membership and (when relevant) class booking.
- May exist as a **staff-created profile only** (name / email / phone) without an account; if they register later, they verify email or phone and claim that profile.
- Manual check-in (search by identifier) when they have no phone for QR.
- Later: assigned routines, announcements, class booking, PRs, progress charts, timers, community (leaderboards, achievements, streaks — **per gym**).

Temporary / day-pass members use the **same** membership flow as regular members.

---

## Core product rules

### Identity and QR

- **One QR per person** across the entire platform.
- Check-in covers attendance, active membership validation, and class-related checks where applicable.
- **No simultaneous use:** after a check-in, the same QR cannot be used at another gym for **4 hours**.
- Check-in **session expires after 4 hours** (no mandatory check-out).

### Memberships and member data

- One account, many memberships; **simultaneous multi-gym use of the credential is forbidden** (rule above).
- Training data (progress, PRs, routines, health notes, etc.) **belongs to the member** and can be visible to gyms they belong to (including when they train at more than one gym).
- Coaches see member detail when the **member allows it**, or when the member is in that coach’s class/event.

### Plans and pricing (gym → member)

- Membership plans and prices may be defined at **gym** or **branch** level.
- Gyms may take payment by any method they manage on site.
- Online / recurring billing via a payment provider: available on **paid AMRAP plans only** (not Freemium). The organization connects its own merchant account (e.g. legal entity onboarding). AMRAP aims for **0% platform fee** on those member charges while the organization has an active paid subscription; card/network fees remain the provider’s.

### Announcements (later)

- Audience can be: everyone, one user, a class, a coach, members, staff, coaches, etc.

### Penalties (later)

- Managed by staff: e.g. suspensions or fines.

### Access hardware (long term)

- Turnstiles / doors / readers are planned after software access control is solid.

### Deletion and non-payment

| Event | Rule |
| ----- | ---- |
| **Delete a gym** | Allowed; scoped to that gym. |
| **Delete an organization** | Allowed; removes the billing account and its gyms under the same retention process. |
| **Deletion retention** | AMRAP is alerted; **30 days** then full delete, or simple **CSV** export to the organization email and AMRAP. |
| **AMRAP subscription unpaid** | **3-day grace**, then automatic drop to **Freemium**: extra gyms become **read-only**; the organization picks **one** gym to keep managing, within Freemium limits. |

### Ownership transfer

- Provisional owner invites the owner; owner accepts; **new owner chooses** what the previous provisional owner may still do.

---

## Who pays AMRAP

The **Organization** is the customer of AMRAP (owner or provisional owner as billing contact). Members pay their **gym**; AMRAP does not replace the gym’s commercial relationship with members, except by providing optional payment tooling on paid plans.

Platform billing for AMRAP itself will use a provider such as **Stripe**, **Mercado Pago**, or similar (final choice by fees and fit). For **gym → member** charging in Mexico, **Mercado Pago** is the likely first integration so organizations can connect a familiar account; more providers can follow.

---

## Subscription plans (AMRAP → Organization)

**Focus:** small operators — **self-serve up to 3 gyms**. Organizations that need **more than 3 gyms** (or custom terms) use **Pro** and **contact AMRAP** for an agreement.

Model: **feature tiers** priced **per organization** (flat) for Freemium, Starter, and Growth — not per-gym on self-serve. Soft caps keep Freemium a real trial, not a forever substitute.

- Billing: **monthly** or **annual** (~**17%** off annual ≈ 10 months priced for 12).
- Prices below are **before tax** (e.g. IVA in Mexico billed separately where applicable).
- **Member payment gateway:** Starter, Growth, and Pro — **not** Freemium.
- **Self-serve ceiling:** Growth covers **2–3** active gyms under one org. Beyond 3 → contact sales (Pro).

### Price list

| Plan | Who it’s for | Gyms | MXN / mo | USD / mo | Notes |
| ---- | ------------ | ---- | -------- | -------- | ----- |
| **Freemium** (*the hook*) | Indie coaches, garage studios, gyms just starting | 1 | **$0** | **$0** | Strict 30 active members — prove QR + day ops |
| **Starter** (*Solo*) | One established gym ready to automate | 1 | **$849** | **$42** | List price in the **$799–$899** band; high practical member cap |
| **Growth** (*Multi-Gym*) | Owner running 2–3 locations | **2–3** | **$1,499** | **$73** | **Flat org rate** (third gym included — no software surprise) |
| **Pro** | 4+ gyms or custom needs | Custom | **Custom** | **Custom** | **Contact AMRAP** — agreement-based |

Annual (illustrative, ~17% off): Starter ≈ $8,490 MXN / $420 USD per year; Growth ≈ $14,990 MXN / $730 USD per year. Pro is quoted per deal.

**Why Growth is flat $1,499:** with 2 gyms already covered, opening the third does not raise the AMRAP bill — loyalty through expansion. (Alternative per-gym pricing was considered; flat is the list offer.)

### Freemium limits (*the hook*)

Prove QR speed, stability, and the ops UI with **no risk**. Tight enough to push upgrade when the box is real.

| Limit | Freemium |
| ----- | -------- |
| Gyms / branches | 1 / 1 |
| Active members | **30** |
| Staff seats (login) | 2 |
| Membership plans | 2 |
| Attendance history | 30 days |
| QR + manual check-in | Yes |
| Basic day dashboard | Yes |
| Feedback inbox | Yes (internal; short retention) |
| Payment gateway | **No** |
| Financial reports / CSV | **No** |
| White-label | **No** (AMRAP branding) |
| Multi-gym / consolidated stats | **No** |

### Starter (*Solo* — one complete gym)

| Limit / unlock | Starter |
| -------------- | ------- |
| Gyms / branches | **1 / 1** |
| Active members | **~500** practical soft cap (protects infra without choking a busy single site) |
| Staff seats | ~5 |
| Membership plans | Unlimited (practical) |
| Attendance history | Full |
| Payment gateway (member billing) | **Yes** — core retention unlock |
| Basic financial reports | **Yes** |
| CSV / data export | **Yes** |
| Inbox | Without Freemium retention ceiling |
| White-label basics | Optional / later on same tier |
| Multi-gym | **No** |

Positioning: much lower monthly than typical competitors (often **$2,000+ MXN**/mo) while giving predictable cash per single-gym customer.

### Growth (*Multi-Gym* — 2 to 3 gyms)

Everything in Starter, plus:

- **2–3 gyms** under the same organization (one invoice)
- **Consolidated dashboard** (“bird’s-eye” across locations)
- **Passport-style** member profiles across sites (one person, multi-gym memberships)
- **Comparative analytics** between gyms / branches
- Same practical member soft cap **per gym** (~500)

Flat **$1,499 MXN / org / mo** — not billed per gym on the public price list.

### Pro (contact)

For **more than 3 gyms**, higher / custom caps, priority support, and later advanced modules. No public list price — sales sets terms after the organization contacts AMRAP.

---

## Platform administration (AMRAP operator)

Global view across organizations: sales, subscriptions, plan changes, user/gym counts, support tooling, and **impersonation**. Future internal seats for a small team (support, sales, billing) share this surface — same database, platform-scoped access.

---

## Product phases

### MVP (foundation + first value)

Architecture and tenancy from day one: **multi-tenant, multi-organization, multi-gym** (even if some UI is still thin).

- Unique user QR / credential
- Member check-in (member device + **front-desk / iPad**: camera and/or keyboard search)
- Staff access control and dashboards
- Owner/staff dashboards
- Create/edit membership plans and pricing
- Internal feedback / complaints inbox (text, internal view only)

### Phase 2

- Coach workflows, announcements, penalties
- Recurring / gateway billing for members, richer membership ops

### Later

- Community (per-gym leaderboards, achievements, streaks)
- Central routine libraries, timers, health alerts
- Owner landing-page builder
- Access hardware (doors / turnstiles)
- Broader payment-provider coverage

---

## Design principles (for scale)

- **Organization is the billing boundary; gym is the operations boundary; branch is the place.**
- **Users are global; roles are contextual.**
- **One credential, anti-abuse rules** (4-hour exclusivity / session).
- **Freemium proves the product; paid plans unlock money movement and multi-gym (self-serve up to 3 gyms; beyond that, Pro via contact).**
- **Same system for gyms and for AMRAP admin** — different permission scope, one data model.
- **White-label and community are per gym**; the platform brand remains AMRAP.

---

## Product flows (UI by role)

See **[`docs/product-flows.md`](docs/product-flows.md)** for end-to-end flows and interface outlines per user type (MVP through later phases): auth, onboarding, owner/staff/coach/member, check-in, billing, platform admin, and edge cases.

## Database

See **[`docs/database.md`](docs/database.md)** for the Postgres schema: hierarchy, tables, RPCs, RLS, and what is intentionally out of scope for later migrations.

---

## Getting started (development)

> **Database:** apply migrations on a clean project (`supabase db reset` locally, or run `001_initial.sql` then `002_onboarding.sql` in the SQL editor). Signup creates an **organization** only; the gym is created in `/[locale]/onboarding`.

Requires [pnpm](https://pnpm.io/installation).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Locale follows the browser (`Accept-Language`); marketing landing at `/es` or `/en`.

### Scripts

| Command | Description |
| ------- | ------------- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |
