# E2E tests (Playwright) — SvelteKit

Browser end-to-end coverage for AMRAP user flows (SvelteKit at repo root). Coverage follows [`docs/product-flows.md`](../docs/product-flows.md) by role.

Unit tests (Vitest) are out of scope here — use Playwright for flows.

## Prerequisites

1. Env vars (from `.env`, `.env.local`, and/or `.env.test`):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Admin API for seeding / confirming users)
   - Optional: `E2E_EMAIL_DOMAIN` (default `amrap-e2e.com`) — must not be a reserved example/test domain; Supabase Auth rejects those
   - **Stripe billing suite** (local only; skips if missing):
     - `STRIPE_SECRET_KEY=sk_test_…`
     - `PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`
     - `STRIPE_WEBHOOK_SECRET=whsec_…` (from `stripe listen` — required for cancel→Freemium webhook test; Checkout tests can fall back to Admin sync)
2. Prefer a **dedicated test Supabase project** so runs do not pollute production.
3. Chromium for Playwright: `pnpm exec playwright install chromium`
4. Stripe **test** catalog lookup keys must exist: `starter_mxn_monthly`, `starter_mxn_annual`, `growth_mxn_monthly`, `growth_mxn_annual` (amounts exclusive of tax). Checkout attaches a manual **IVA 16%** Tax Rate (created on first checkout if missing).

### Stripe billing E2E (hybrid, local-only)

```bash
# Terminal A — forward webhooks to the Vite app (recommended)
stripe listen --forward-to localhost:5173/api/stripe/webhook
# Copy the whsec_… into .env as STRIPE_WEBHOOK_SECRET

# Terminal B
pnpm test:e2e:billing
```

Specs **skip** when keys are not `sk_test_` / `pk_test_`. Do not run against live Stripe.

## Commands

```bash
pnpm test:e2e          # all projects (one process)
pnpm test:e2e:owner    # owner + provisional
pnpm test:e2e:staff    # staff forbidden + day-to-day
pnpm test:e2e:trainer  # trainer shell + denied routes
pnpm test:e2e:member   # member /me shell
pnpm test:e2e:flows    # multi-user invite accept/decline
pnpm test:e2e:billing  # Stripe org billing
pnpm test:e2e:ui       # Playwright UI mode
```

**Do not run several `pnpm test:e2e:*` scripts in parallel terminals.** They share `e2e/.auth/` and port **5173**. Concurrent runs overwrite owner creds, race `globalTeardown` cleanup (`no OWNER gym_role`), and knock over Vite (`ERR_CONNECTION_REFUSED` / `chrome-error://`). A file lock serializes overlapping processes (second run waits), but prefer one suite at a time or a single `pnpm test:e2e`.

Playwright starts `pnpm run dev` (or reuses an existing server on port **5173** when not in CI). Override with `PLAYWRIGHT_BASE_URL`.

If billing (or other) runs die with `ERR_CONNECTION_REFUSED` mid-suite, a stale/broken Vite on `:5173` was likely reused — stop it and re-run so Playwright owns a fresh `pnpm run dev`.

## Coverage map (roles)

| Area | Status | Notes |
| ---- | ------ | ----- |
| Owner / provisional | Shipped | Register/onboarding, ops CRUD, billing, identity switch |
| Staff day-to-day + forbidden | Shipped | Admin-accepted seed; no org/staff/trainers |
| Trainer shell + denied | Shipped | Trainer dashboard; check-in/members/payments/org denied |
| Member `/me` shell | Shipped | Home, QR, classes, timers, inbox, profile |
| Timers phase editor / Repeat toggle | Deferred | Covered in product-flows; UI exercised manually (localStorage, no server fixture) |
| Invite accept → welcome → destination | Shipped | Admin PENDING seed (no Resend); staff/trainer/member |
| Invite decline → cancelled in list | Shipped | Decline signs out; owner list shows cancelled badge |
| Owner UI invite → email link | Deferred | Needs `generateLink` + confirm URL or inbox; Admin PENDING is equivalent post-confirm |
| Member book/cancel class | Deferred | Needs scheduled sessions fixture |
| Trainer create class as self | Deferred | |
| Pending-invite blocks ops/`/me` | Partial | Covered implicitly by landing on `/invite` first |

## How auth works in tests

- Owner / provisional **storageState**: Admin seed completes org + gym + role + onboarding flags (`completeOwnerOnboardingSeed`); setup only logs in and saves cookies. UI onboarding stays covered by `auth-register-onboarding.spec.ts`.
- Staff / trainer / member **storageState** from setup projects (Admin seed into owner gym where applicable).
- Multi-user invite specs use a **fresh browser** + `seedPendingGymRoleUser` / `seedPendingMemberInvite` (profile incomplete + `invite_status=PENDING`), then UI accept/decline + welcome.
- Do not depend on Resend for CI.

Credentials under `e2e/.auth/` are gitignored. Cleanup via `globalTeardown` deletes owner/provisional E2E orgs (cascades gym-scoped rows and related invite users).

Skip cleanup while debugging: `E2E_SKIP_CLEANUP=1 pnpm test:e2e`.

## Layout

```
e2e/
  setup/           # storageState seeds (owner, provisional, staff, trainer, member)
  fixtures/        # creds helpers
  helpers/         # Supabase Admin + auth/invite UI
  public/          # marketing
  owner/           # owner / provisional
  staff/
  trainer/
  member/
  multi-user/      # invite accept / decline chains
```

## Agent rule

New or changed user-facing features must update product flows **and** add/adjust Playwright coverage for the affected role(s). See `AGENTS.md` → Testing / E2E.
