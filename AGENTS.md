# AMRAP — SvelteKit (repo root)

This repo’s **default app** is SvelteKit. The previous Next.js app lives in [`amrap-next/`](amrap-next/) as a **read-only reference archive**.

| Path | Role |
|------|------|
| `src/`, `static/`, `e2e/` | SvelteKit app (source of truth) |
| `supabase/migrations/` | Shared Postgres schema |
| `README.md`, `docs/*` | Product + schema docs |
| `amrap-next/` | Legacy Next.js — **do not edit** |

### SvelteKit only (do not dual-maintain Next)

**Never implement, port, or “keep in sync” the same change in both apps.** All product work happens in the SvelteKit tree (`src/`, `static/`, `e2e/`, root configs). Treat `amrap-next/` as historical reference only — do not modify it unless the user **explicitly** asks to change the legacy Next app.

**Stack:** SvelteKit · Svelte 5 (runes) · Tailwind v4 · Supabase SSR · TypeScript · Zod · Playwright (E2E under `e2e/`).

**Locales:** `es` (default) · `en` — routes under `/[locale]/…`; auth callbacks under `/auth/*` (no locale prefix).

---

## Package manager

Use **pnpm** only (`pnpm install`, `pnpm add`, `pnpm run dev`, etc.). Do not use `npm` or `yarn`.

## Verification

Do **not** run `pnpm run build` (or `vite build`) on every change unless the user asks for a production build check, or the task is specifically about build/deploy/CI failures. Prefer `pnpm run check` (`svelte-check`) when you need a quick type pass, or rely on the dev server. **PWA:** service worker + install criteria are production-oriented; `devOptions.enabled` is on for local SW testing — use HTTPS/`localhost` and Chrome Application panel to verify.

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev               # http://localhost:5173
```

### Environment

| Variable | Purpose |
|----------|---------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (bootstrap, invites) |
| `PUBLIC_APP_URL` | Auth email redirect origin **and** absolute SEO/canonical base in production |
| `PUBLIC_FORMSPREE_FORM_ID` | Landing contact form |
| `STRIPE_SECRET_KEY` | Server-only Stripe secret (org subscription Checkout / Portal / webhooks) |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional client use; also accepts `STRIPE_PUBLISHABLE_KEY`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `POST /api/stripe/webhook` |

Also accepts `NEXT_PUBLIC_*` fallbacks when sharing env with `amrap-next/` (see `src/lib/supabase/env.ts`).

---

## Testing / E2E

Playwright under `e2e/` is the source of truth for **user-flow** coverage (not Vitest). Vitest may be added later for pure `src/lib/` unit tests only.

**Update E2E in the same change** whenever you add, change, or remove a user-facing feature, screen, nav item, flow, or permission guard.

Rules:

1. Cover every **affected role** under `e2e/<role>/`.
2. Keep [`docs/product-flows.md`](docs/product-flows.md) and matching `e2e/**/*.spec.ts` in sync.
3. Use locale routes (`/es/…` by default) and dictionary-backed copy for assertions.
4. Seed auth via Admin API helpers in `e2e/helpers/` — do not depend on real inbox OTP in CI.
5. Never commit `SUPABASE_SERVICE_ROLE_KEY` or `e2e/.auth/` storage state.
6. Mark flows **shipped · partial · planned** in `product-flows.md` for the SvelteKit app (ignore Next parity).

Run: `pnpm test:e2e` · `pnpm test:e2e:owner` · see [`e2e/README.md`](e2e/README.md).

---

## Project

Multi-tenant gym membership admin (SvelteKit, Supabase, Tailwind). Marketing at `/[locale]`; auth at `/[locale]/login`, `/[locale]/register`; app surfaces migrating to `/[locale]/dashboard`, etc.

- **Product / business docs:** [`README.md`](README.md) — business hierarchy, roles, pricing, phases. Update when **business rules** change.
- **UI flows:** [`docs/product-flows.md`](docs/product-flows.md) — per-role flows (SvelteKit status labels).
- **Schema:** [`docs/database.md`](docs/database.md) — tables, RPCs, RLS (shared DB).
- **Legacy Next:** [`amrap-next/`](amrap-next/) — read-only archive; do not edit or dual-maintain.

### SEO (public pages — always improve)

When changing **marketing/public** UI, copy, routes, or product positioning — and whenever updating **`README.md`** or **`docs/product-flows.md`** in ways that affect how the product is described publicly — **proactively improve SEO** in the same change (do not wait to be asked):

1. **Titles & descriptions** — unique, intent-matched (`es` + `en`); brand + primary benefit; ~50–60 / ~140–160 chars where practical.
2. **Canonical + hreflang** — every indexable locale page; absolute URLs via `PUBLIC_APP_URL` / `getPublicAppUrl()`.
3. **Open Graph / Twitter** — title, description, image (absolute), `og:locale`.
4. **Structured data** — JSON-LD where it fits (Organization, SoftwareApplication, FAQPage, etc.); keep in sync with visible copy.
5. **Crawl control** — `robots.txt` + sitemap for public URLs; **`noindex`** on auth-gated ops/member/onboarding/invite surfaces (never leak private app URLs into the index).
6. **Semantics** — one clear `h1`, meaningful headings, descriptive link text; avoid cloaking or keyword stuffing.
7. **Docs** — if public positioning or indexable routes change, note it in `docs/product-flows.md` (marketing/landing row) when relevant.

Private app chrome (dashboard, members, check-in, etc.) stays `noindex` — SEO effort targets **landing, register, login**, and future public pages.

### Migration status (high level)

| Area | Status |
|------|--------|
| Landing · auth · onboarding · invite · welcome | shipped |
| Ops app · member app · dashboard register dialog | shipped |
| Playwright E2E (`e2e/`) | shipped |
| Stripe checkout · multi-gym create · transfer UI · kiosk | checkout shipped (MXN); multi-gym create / transfer / kiosk polish planned |

---

## Product flows (must keep in sync)

[`docs/product-flows.md`](docs/product-flows.md) is the source of truth for **UI/UX flows per user type**.

**Update `docs/product-flows.md` in the same change** whenever you add, change, or remove a feature, screen, nav item, or flow — for **every affected user type**.

Cover: **Who** · **Where** · **What** · **Edge cases** · **Status** (shipped · partial · planned).

---

## Folder structure (must follow)

```
src/
  routes/
    +layout.svelte              # root (fonts, theme, global CSS)
    +page.server.ts             # / → locale redirect
    [locale]/
      +layout.svelte            # locale wrapper
      +page.svelte              # landing
      login/                    # +page.svelte + +page.server.ts (load + actions)
      register/
      onboarding/               # …
    auth/
      confirm/+server.ts        # Supabase email callback (GET)
      ensure-organization/+server.ts
  lib/
    components/
      ui/                       # Input, Button, FormField, …
      landing/                  # marketing-only
      auth/                     # LoginForm, AuthShell, …
    i18n/                       # config, dictionaries, landing-dictionaries
    supabase/                   # env, server, client, admin
    auth/                       # session, post-auth-redirect, permissions
    validation/                 # Zod schemas, field-errors
    server/auth/                # login/register/confirm action logic
    types/                      # shared domain types
  hooks.server.ts               # session refresh, locale redirect, auth guard
static/                         # public assets
supabase/migrations/            # SQL schema (shared)
amrap-next/                     # legacy Next.js — read-only archive (do not edit)
```

- Route UI lives under `src/routes/`. Shared logic in `src/lib/`. Shared UI in `src/lib/components/`.
- **Form actions** live in `+page.server.ts` (`export const actions = { … }`), not separate `actions.ts` files unless the file would become huge.
- **Route handlers** use `+server.ts` (`GET`, `POST`, …).
- **Do not** add a parallel root `app/` tree — this is SvelteKit, not Next.js.
- **Do not** dual-maintain features in `amrap-next/` — SvelteKit only unless the user explicitly requests Next changes.
- DB migrations stay in **`supabase/migrations/`**.

---

## Database migrations

- Every schema change is a **new file** in **`supabase/migrations/`** — never edit an already-applied migration.
- Keep [`docs/database.md`](docs/database.md) in sync in the same change.
- **Verify the target Supabase project** before `db push`, link, or remote apply.

---

## Reuse components (no one-off duplicates)

- Never recreate inputs, buttons, form shells, labels, or empty states if a shared component exists under `src/lib/components/ui/`.
- Prefer **one shared control** per concern (`Input.svelte`, `PasswordInput.svelte`, `Button.svelte`, `FormField.svelte`).
- Extract on the second copy.
- Landing-only visuals stay in `src/lib/components/landing/`.

---

## Internationalization (all user-facing copy)

- Every user-visible string in **`es` + `en`** in `src/lib/i18n/dictionaries.ts` and/or `landing-dictionaries.ts`.
- No hardcoded UI copy in `.svelte` files (labels, placeholders, errors, `aria-label`s).
- Server-returned messages (validation, auth errors) from the dictionary for the request locale.

---

## Validation, schemas / DTOs, sanitization

- **Validate all inputs** at the server boundary (`+page.server.ts` actions, `+server.ts` handlers) before DB or Auth calls. Client checks are UX only.
- **Zod schemas** in `src/lib/validation/schemas.ts` — regex + length limits on every user-editable field.
- Reuse `emailSchema`, `personNameSchema`, `entityNameSchema`, `passwordSchema`, sanitizers, etc.
- Map Zod issues via `zodFieldErrors` + dictionary `validation.*`; return `{ fieldErrors?, error? }` from actions.
- Render per-field errors with `FormField` `error` prop (`aria-invalid`, `role="alert"`).
- **Sanitize outputs:** Svelte escapes text by default; never use `{@html …}` with user/gym content.

---

## Backend: load functions, form actions, route handlers

- **Default:** mutations and privileged reads via **`+page.server.ts`** (`load`, `actions`) using `createClient()` from `src/lib/supabase/server.ts`.
- **`hooks.server.ts`:** Supabase session refresh on every request; locale negotiation; auth guard (public: landing home, login, register).
- **`+server.ts`:** webhooks, OAuth/confirm callbacks, public HTTP APIs — REST conventions, correct status codes.
- **Service role** (`src/lib/supabase/admin.ts`): server-only; never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- **Errors:** dictionary messages to the UI; log detail server-side; no raw stack traces in responses.
- After successful mutations: `redirect(303, …)` or `invalidateAll()` / `invalidate('…')` from the client when needed — avoid redundant refetches.

### SvelteKit patterns (not Next.js)

| Next.js | SvelteKit |
|---------|-----------|
| Server Actions | `export const actions` in `+page.server.ts` |
| `revalidatePath` | `invalidateAll()` or `depends('…')` + re-run load |
| Route Handlers `route.ts` | `+server.ts` |
| `cookies()` from `next/headers` | `event.cookies` / `getRequestEvent().cookies` |
| `proxy.ts` middleware | `hooks.server.ts` |
| RSC + `useActionState` | `use:enhance` + `form` prop from action result |

- **`createClient()`** uses `getRequestEvent()` — only call from load, actions, hooks, or `+server.ts` during a request.
- **Prefer work in Postgres** (filters, joins, aggregates, `.range` pagination) over loading large sets into the app.

---

## Performance

- Treat every round-trip (browser → SvelteKit load/action, SvelteKit → Supabase) as expensive.
- **Do not** refetch on every local UI toggle; use component state for dialogs, tabs, and accordions.
- **Do not** call `invalidateAll()` after every action if the action already returns data the form needs, or if a targeted `invalidate` suffices.
- One user gesture → ideally **one** mutation (or one RPC).
- Select only needed columns; avoid N+1 loops from load functions.
- Do not poll Supabase on an interval unless the product requires live updates.

---

## UI: design system, responsive, a11y

- Shared tokens in `src/routes/layout.css` (`--color-*`, `.landing-*`, `.auth-container`, `.glass-panel`).
- **Responsive** mobile-first; auth and app layouts must work on ~375px.
- Label every input; `aria-label` on icon-only controls; visible focus; semantic HTML.
- **Disable submit** until required fields are filled (client-side).

### Responsive UI / UX (must follow)

Every UI change must work on phone and desktop.

- **Mobile-first:** `sm` / `md` / `lg` breakpoints.
- **Ops shell (when migrated):** desktop = collapsible sidebar; mobile = bottom tabs + **More** sheet — no per-page nav.
- **Touch targets** ≥ ~44×44px; respect `safe-area-inset-*` on fixed chrome.
- **Layout:** stack on small screens; no desktop-only tables without a mobile alternative.
- **One job per section;** reuse design system — no one-off forks.
- **Viewport:** `viewport-fit=cover` in `src/app.html` so `env(safe-area-inset-*)` works on real devices.
- **App shells:** use `.amrap-app-shell` (`100dvh` / `100svh`) — not `h-screen` / `100vh` — for ops and member layouts.
- **Shared tokens** in `src/routes/layout.css` `:root` — prefer these over one-off rem values:

| Token | Use for |
|-------|---------|
| `--touch-target` / `--control-height` | Buttons, inputs, icon hit areas (44px) |
| `--spacing-page` (+ `-md` / `-lg`) | Page padding (vertical on large screens) |
| `--spacing-page-x-lg` | Desktop horizontal gutters (~5% each side) |
| `--ops-header-height` / `--ops-bottom-nav-height` / `--ops-bottom-clearance` | Ops chrome + main bottom pad |
| `--safe-top` / `--safe-bottom` | Notch / home indicator |
| `--content-max` / `--content-max-narrow` | Full available width (gutters via page padding) |

See also `.cursor/rules/responsive-ux.mdc`.

---

## Auth, tenancy, security

- RLS and tenant scoping; never query all tenants from user-scoped clients.
- Check session / role via `src/lib/auth/*` before privileged UI or actions.
- Public env via `PUBLIC_*` in `$env/static/public`; secrets via `$env/static/private`.
- Auth flow mirrors the Next app: `resolvePostAuthPath`, pending confirm cookies, `/auth/confirm`, org bootstrap RPCs.

---

## Svelte 5 conventions

- Use **runes** (`$state`, `$derived`, `$props`, `$effect`) in new components — this project enables runes mode.
- Prefer **`$lib/`** imports (configured in `svelte.config` / Vite).
- Colocate small helpers in `src/lib/`; avoid `src/helpers/` or duplicate trees.
