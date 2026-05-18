# AMRAP

Multi-tenant gym membership control (Next.js, Supabase, Tailwind).

## Getting started

Requires [pnpm](https://pnpm.io/installation).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Locale follows the browser (`Accept-Language`); marketing landing at `/es` or `/en`.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Development server       |
| `pnpm build`   | Production build         |
| `pnpm start`   | Run production build     |
| `pnpm lint`    | ESLint                   |

## Environment

Copy `.env.local.example` to `.env.local` and set Supabase URL, publishable key, and (for signup with email confirmation) `SUPABASE_SERVICE_ROLE_KEY`.
