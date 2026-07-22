# E2E tests (Playwright) — SvelteKit

Browser end-to-end coverage for AMRAP user flows (SvelteKit at repo root). Phase 1 focuses on **owner** and **provisional owner** paths from [`docs/product-flows.md`](../docs/product-flows.md).

Unit tests (Vitest) are out of scope here — use Playwright for flows.

## Prerequisites

1. Env vars (from `.env`, `.env.local`, and/or `.env.test`):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Admin API for seeding / confirming users)
   - Optional: `E2E_EMAIL_DOMAIN` (default `amrap-e2e.com`) — must not be a reserved example/test domain; Supabase Auth rejects those
2. Prefer a **dedicated test Supabase project** so runs do not pollute production.
3. Chromium for Playwright: `pnpm exec playwright install chromium`

## Commands

```bash
pnpm test:e2e          # all E2E projects
pnpm test:e2e:owner    # owner + provisional suite
pnpm test:e2e:ui       # Playwright UI mode
```

Playwright starts `pnpm run dev` (or reuses an existing server on port **5173** when not in CI). Override with `PLAYWRIGHT_BASE_URL`.

## How auth works in tests

- Most owner specs reuse a **storageState** written by `e2e/setup/owner.setup.ts` (Admin `createUser` + org bootstrap + UI onboarding).
- Provisional powers use `e2e/setup/provisional.setup.ts` (`roleIntent=manager`).
- Register/onboarding and invalid login live in `owner-auth` (no storage state). Email confirmation is completed via the Admin API when the UI lands on the OTP screen. If Supabase rate-limits Auth emails, the register test falls back to Admin `createUser` + org bootstrap (same post-confirm state).

Credentials and cookies under `e2e/.auth/` are gitignored.

## Cleanup (after each run)

Playwright `globalTeardown` (`e2e/global-teardown.ts`) hard-deletes seeded **owner** and **provisional** accounts from `e2e/.auth/*-creds.json`. The register/onboarding spec cleans its own user in a `finally` block.

Order matters:

1. **Hard-delete** organizations named `E2E …` created by the user → FK **CASCADE** removes `gyms` → `branches` and gym-scoped rows (plans, memberships, classes, payments, …).
2. Remove leftover unclaimed **persons** (members) that membership cascade does not delete.
3. Delete related invite auth users (`gym_roles`), then the owner auth user.

Deleting only the auth user is **not** enough: `organizations.created_by` and `gyms.owner_user_id` are `ON DELETE SET NULL`, so orgs/gyms would remain.

Safety: org hard-delete only runs when `organizations.name` starts with `E2E `. Prefer a dedicated test Supabase project.

Skip cleanup while debugging: `E2E_SKIP_CLEANUP=1 pnpm test:e2e`.

## Layout

```
e2e/
  setup/           # storageState seed projects
  fixtures/        # owner seed helpers
  helpers/         # Supabase Admin + UI helpers
  public/          # marketing / unauthenticated specs
  owner/           # owner / provisional specs
```

Member / staff feedback flows live under `owner/feedback-shell.spec.ts` (seed via Admin API against the owner gym). Later: dedicated `e2e/staff/`, `e2e/trainer/`, `e2e/member/` projects.

## Agent rule

New or changed user-facing features must update product flows **and** add/adjust Playwright coverage for the affected role(s). See `AGENTS.md` → Testing / E2E.
