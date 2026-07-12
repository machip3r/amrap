<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Package manager

Use **pnpm** only (`pnpm install`, `pnpm add`, `pnpm run dev`, etc.). Do not use `npm` or `yarn` for this repo.

## Verification

Do **not** run `pnpm run build` (or `next build`) on every change unless the user asks for a production build check, or the task is specifically about build/deploy/CI failures. Prefer `pnpm run lint` when you need a quick check, or rely on the dev server and TypeScript feedback.

## Project

Multi-tenant gym membership admin (Next.js App Router, Supabase, Tailwind). Marketing at `/[locale]`; app under `/[locale]/dashboard`, etc. Locales: **`es`** (default) and **`en`**.

- **Product / business docs:** [`README.md`](README.md) is the source of truth for AMRAP’s business hierarchy, roles, core product rules, pricing, and phases. If a change alters **business rules**, **product behavior**, **pricing**, **roles**, or **general how AMRAP works**, update `README.md` in the **same change** — do not leave product docs stale. UI flow details live in [`docs/product-flows.md`](docs/product-flows.md); schema details in [`docs/database.md`](docs/database.md).

---

## Folder structure (must follow)

```
app/
  [locale]/
    (marketing)/     # public landing
    (auth)/          # login, register, complete-setup
    (app)/           # authenticated product (dashboard, members, …)
  auth/              # auth callbacks / confirm routes (no locale UI)
components/          # shared UI (inputs, buttons, forms shells, …)
  landing/           # marketing-only components
lib/
  i18n/              # locales, dictionaries, negotiation
  supabase/          # clients, env, session helpers
  auth/              # session, permissions
types/               # shared domain types / DTOs
supabase/migrations/ # SQL only — schema changes go here
```

- Route UI lives under `app/[locale]/…`. Shared logic in `lib/`. Shared UI in `components/`.
- Do **not** invent parallel trees (`src/`, `ui/`, ad-hoc `helpers/` at root) without an explicit request.
- Colocate **server actions** next to the route that owns them (`…/actions.ts`).

---

## Database migrations

- Every schema / SQL change is a **new file** under `supabase/migrations/` (e.g. `003_…sql`, `004_…sql`).
- **Never** edit an already-created migration that may have been applied — append a new migration instead.
- Keep migrations SQL-only; name them descriptively after the change.
- **Keep [`docs/database.md`](docs/database.md) in sync** with every migration and any other database change (tables, columns, constraints, RPCs, triggers, RLS policies, enums). Update that English doc in the **same change** as the SQL — do not leave schema docs stale.

---

## Reuse components (no one-off duplicates)

- **Never** recreate inputs, buttons, form shells, labels, error text, empty states, or similar if a shared component exists — **reuse or extend** it.
- Prefer **one smart shared control** per concern (e.g. one `Input`, one `PasswordInput`, one `Button`, one form field wrapper) used across auth and app.
- If a pattern is copied a second time, **extract** to `components/` before shipping the duplicate.
- Landing-only visuals stay in `components/landing/`; product UI stays shared or under feature folders — do not fork the design system per page.

---

## Internationalization (all user-facing copy)

- Every user-visible string must exist in **all supported locales** (`es` + `en` today) in `lib/i18n/dictionaries.ts` and/or `lib/i18n/landing-dictionaries.ts`.
- No hardcoded UI copy in components/pages (placeholders, labels, buttons, errors, empty states, `aria-label`s).
- When adding a key, add it to **every** locale in the same change.
- Server-returned user messages (validation, auth errors) must come from the dictionary for the request locale — never English-only literals.

---

## Validation, schemas / DTOs, sanitization

- **Validate all inputs** at the server boundary (Server Actions / Route Handlers) before DB or Auth calls. Client checks are UX only — not security.
- Prefer **Zod schemas** in `lib/validation/` (or explicit typed parsers shared with `types/`) — do not trust raw `FormData` / JSON shapes.
- Treat domain shapes in `types/` as the contract; keep action payloads aligned with those DTOs.
- **Every user-editable field** must have a **Zod rule** with **length limits** and an **allowed-character pattern (regex)** — reject unexpected / control characters early so they never reach Auth, DB, cookies, or mailto/URLs.
  - Examples: email → lowercase + email regex + max 254; phone → digits and phone punctuation + max length; names → letters/spaces/safe punctuation + max length; passwords → min/max + no control characters; OTP → alphanumeric (or digits) with fixed length bounds.
  - Prefer reusing helpers from `lib/validation/schemas.ts` (`emailSchema`, `personNameSchema`, `entityNameSchema`, `phoneSchema`, etc.) instead of ad-hoc `z.string()`.
  - Mirror limits on the client with `maxLength` / `pattern` / `inputMode` / `autoCapitalize` where it improves UX — server schema remains authoritative.
- **Show validation errors to the user** — never fail silently or with only a generic banner when a specific field is wrong.
  - Map Zod issues to per-field messages via `lib/validation/field-errors.ts` (`zodFieldErrors`) and dictionary copy (`validation.*` in `lib/i18n/dictionaries.ts`, plus landing contact errors when needed).
  - Return `{ fieldErrors?: Record<string, string>; error?: string }` from actions; render each message under the matching control with `FormField`’s `error` prop (`aria-invalid` / `role="alert"`).
  - Form-level `error` is for auth/server failures (wrong password, network, forbidden) — not a substitute for field errors.
- **Sanitize / escape outputs**: rely on React text escaping; never inject unsanitized user HTML (`dangerouslySetInnerHTML`) with member/gym-provided content. Encode when embedding user data in URLs, QR payloads, or emails.
- Trim strings; reject empty required fields; constrain lengths and enums (`Role`, `PaymentMethod`, etc.).

---

## Backend: Server Actions, APIs, errors

- **Default**: mutations and privileged reads via **Next.js Server Actions** or server components using `lib/supabase/server.ts`. Do not call Supabase with elevated privileges from the client.
- **Route Handlers** (`app/**/route.ts`): use for webhooks, OAuth/confirm callbacks, or public HTTP APIs — follow **REST** conventions (correct methods, status codes, JSON error body). Do not add GraphQL unless explicitly requested.
- **Service role** (`lib/supabase/admin.ts`): only on the server, only when RLS/session cannot do the job; never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- **Errors**: handle consistently — map failures to dictionary messages; return `{ error: string }` (or a shared result type) from actions; do not leak raw DB/Auth stack traces to the UI. Log server-side detail when useful; show safe copy to users.
- After successful mutations: `revalidatePath` / `redirect` as appropriate; keep success and failure paths explicit and clean (no silent `catch`).

---

## UI: design system, responsive, a11y

- Use shared design tokens / CSS variables (`--color-*`) and existing Tailwind patterns — no one-off color systems per page.
- **Responsive** by default (mobile → desktop); auth and app layouts must work on small screens.
- **Accessibility basics**: label every input (`htmlFor` / wrapping label), meaningful button text, `aria-label` for icon-only controls, visible focus, sufficient contrast, do not rely on color alone for errors.
- Prefer semantic HTML (`button`, `label`, `nav`, headings in order).
- **Disable submit buttons** until required form fields are filled (client-side). Do not leave primary submit actions enabled on empty required forms (auth, onboarding, and app forms).

---

## Auth, tenancy, security

- Respect RLS and tenant scoping; never query “all tenants” from user-scoped clients.
- Check session / role via `lib/auth/*` before privileged UI or actions.
- Secrets only in server env (`SUPABASE_SERVICE_ROLE_KEY`, etc.); public keys only via `NEXT_PUBLIC_*` as already patterned in `lib/supabase/env.ts`.
