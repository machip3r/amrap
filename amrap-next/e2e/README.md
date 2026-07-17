# E2E tests (Playwright)

Browser end-to-end coverage for AMRAP user flows. Phase 1 focuses on **owner** and **provisional owner** paths from [`docs/product-flows.md`](../docs/product-flows.md).

Unit tests (Vitest) are out of scope here — use Playwright for flows.

## Prerequisites

1. Env vars (from `.env.local` and/or `.env.test`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Admin API for seeding / confirming users)
2. Prefer a **dedicated test Supabase project** so runs do not pollute production.
3. Chromium for Playwright: `pnpm exec playwright install chromium`

## Commands

```bash
pnpm test:e2e          # all E2E projects
pnpm test:e2e:owner    # owner + provisional suite
pnpm test:e2e:ui       # Playwright UI mode
```

Playwright starts `pnpm run dev` (or reuses an existing server on port 3000 when not in CI).

## How auth works in tests

- Most owner specs reuse a **storageState** written by `e2e/setup/owner.setup.ts` (Admin `createUser` + org bootstrap + UI onboarding).
- Provisional powers use `e2e/setup/provisional.setup.ts` (`roleIntent=manager`).
- Register/onboarding and invalid login live in `owner-auth` (no storage state). Email confirmation is completed via the Admin API when the UI lands on the OTP screen. If Supabase rate-limits Auth emails, the register test falls back to Admin `createUser` + org bootstrap (same post-confirm state).

Credentials and cookies under `e2e/.auth/` are gitignored.

## Layout

```
e2e/
  setup/           # storageState seed projects
  fixtures/        # owner seed helpers
  helpers/         # Supabase Admin + UI helpers
  public/          # marketing / unauthenticated specs
  owner/           # owner / provisional specs
```

Later: `e2e/staff/`, `e2e/trainer/`, `e2e/member/`.

## Agent rule

New or changed user-facing features must update product flows **and** add/adjust Playwright coverage for the affected role(s). See `AGENTS.md` → Testing / E2E.
