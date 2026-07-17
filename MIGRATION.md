# Repo layout — SvelteKit default

The **default app** is SvelteKit at the repo root. The previous Next.js app is archived in [`amrap-next/`](amrap-next/).

```bash
pnpm install
cp .env.example .env
pnpm dev          # http://localhost:5173
pnpm run check    # svelte-check
pnpm test:e2e     # Playwright (see e2e/README.md)
```

Legacy Next:

```bash
cd amrap-next
pnpm install
pnpm dev          # http://localhost:3000
```

## Route parity (SvelteKit vs archived Next)

| Route | Status |
|-------|--------|
| `/[locale]` | Landing (shipped) |
| `/[locale]/login`, `/register` | Auth + OTP (shipped) |
| `/[locale]/complete-setup` | Redirect → onboarding (shipped) |
| `/auth/confirm`, `/auth/ensure-organization` | Callbacks (shipped) |
| `/[locale]/onboarding` | Full 4-step stepper (shipped) |
| `/[locale]/welcome` | Profile welcome (shipped) |
| `/[locale]/invite`, `/invite/password` | Invite accept + password (shipped) |
| Ops shell | AppNav, OpsMobileNav, OpsNavLogo, brand CSS vars (shipped) |
| `/[locale]/dashboard` | Ops + trainer dashboard; unified register quick actions (shipped) |
| `/[locale]/members`, `/members/[id]` | List, create, renew, care, delete (shipped) |
| `/[locale]/checkin` + history | Desk QR/manual/walk-in + calendar (shipped) |
| `/[locale]/plans` | CRUD + day-pass price (shipped) |
| `/[locale]/payments` | List, search, record (shipped) |
| `/[locale]/staff`, `/trainers` + `[id]` | List, invite, remove (shipped) |
| `/[locale]/team` | Placeholder (same as Next) |
| `/[locale]/classes`, `/classes/[sessionId]` | Catalog, calendar, roster (shipped) |
| `/[locale]/timers` | TimerApp (shipped) |
| `/[locale]/settings` | Nav + branding (shipped) |
| `/[locale]/organization` | Plans/gyms/delete (shipped; checkout/create-gym coming soon) |
| `/[locale]/me` + subpages | Home, classes, inbox, QR, timers (shipped) |

## Remaining (product Planned — same as Next)

- Stripe checkout / multi-gym create
- Ops inbox, ownership transfer UI, kiosk mode, gym/branch switcher

Shared: `supabase/migrations/`, `docs/`, `static/`.
