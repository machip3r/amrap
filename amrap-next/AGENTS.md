> **Legacy package.** Default product development is SvelteKit at the **repo root**. Only use these rules when working inside `amrap-next/`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Package manager

Use **pnpm** only (`pnpm install`, `pnpm add`, `pnpm run dev`, etc.). Do not use `npm` or `yarn` for this repo.

## Verification

Do **not** run `pnpm run build` (or `next build`) on every change unless the user asks for a production build check, or the task is specifically about build/deploy/CI failures. Prefer `pnpm run lint` when you need a quick check, or rely on the dev server and TypeScript feedback.

## Testing / E2E

Playwright under `e2e/` is the source of truth for **user-flow** coverage (not Vitest). Vitest may be added later for pure `lib/` unit tests only.

**Update E2E in the same change** whenever you:

- Add, change, or remove a **user-facing feature**, **screen**, **nav item**, or **flow**
- Change **who can do what** (roles, permissions, guards, post-auth redirects)
- Ship something that was previously planned (or defer something that was shipped)

Rules:

1. Cover every **affected role** (owner / provisional, staff, trainer, member, …) under `e2e/<role>/`.
2. Keep [`docs/product-flows.md`](docs/product-flows.md) and the matching `e2e/**/*.spec.ts` in sync with the code.
3. Prefer role-based folders (`e2e/owner/`, later `e2e/staff/`, `e2e/member/`).
4. Use locale routes (`/es/…` by default) and dictionary-backed copy for assertions — no English-only assumptions beyond what the `es` dictionary provides.
5. Seed / confirm auth via Admin API helpers in `e2e/helpers/` — do not depend on real inbox OTP for CI.
6. Never commit `SUPABASE_SERVICE_ROLE_KEY` or `e2e/.auth/` storage state.
7. If E2E is deferred (e.g. Planned-only UI), say so explicitly in the PR.

Run: `pnpm test:e2e` · `pnpm test:e2e:owner` · see [`e2e/README.md`](e2e/README.md).

## Project

Multi-tenant gym membership admin (Next.js App Router, Supabase, Tailwind). Marketing at `/[locale]`; app under `/[locale]/dashboard`, etc. Locales: **`es`** (default) and **`en`**.

- **Product / business docs:** [`README.md`](README.md) is the source of truth for AMRAP’s business hierarchy, roles, core product rules, pricing, and phases. If a change alters **business rules**, **product behavior**, **pricing**, **roles**, or **general how AMRAP works**, update `README.md` in the **same change** — do not leave product docs stale. UI flow details live in [`docs/product-flows.md`](docs/product-flows.md); schema details in [`docs/database.md`](docs/database.md).

---

## Product flows (must keep in sync)

[`docs/product-flows.md`](docs/product-flows.md) is the source of truth for **UI/UX flows per user type**: who enters, what they see, what they can do, happy paths, edge cases, and route map.

**Update `docs/product-flows.md` in the same change** whenever you:

- Add, change, or remove a **feature**, **screen**, **nav item**, or **user-facing flow**
- Change **who can do what** (roles, permissions, guards, redirects after auth/onboarding)
- Change **post-login / post-action destinations**, empty states, or paywall/limit UX
- Ship something that was previously marked planned (or defer something that was shipped) — update status labels accordingly

Cover **every user type** that the change touches (e.g. Owner, Provisional owner, Staff, Trainer/Coach, Member, Platform admin, Public/auth). Document:

1. **Who** — which role(s) / context
2. **Where** — route(s) and entry points (nav, CTA, deep link)
3. **What** — steps of the happy path
4. **Edge cases** — errors, limits, forbidden, empty states
5. **Status** — shipped · partial · planned (keep planned flows documented; do not delete them when unimplemented)

Do **not** leave `product-flows.md` stale relative to the code. Prefer updating the doc while implementing, not as a follow-up. Business rules still belong in `README.md`; schema in `docs/database.md` — this file is the **interface flow** companion.

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
../supabase/migrations/ # SQL only — schema lives at repo root
```

- Route UI lives under `app/[locale]/…`. Shared logic in `lib/`. Shared UI in `components/`.
- Do **not** invent parallel trees (`src/`, `ui/`, ad-hoc `helpers/` at root) without an explicit request.
- Colocate **server actions** next to the route that owns them (`…/actions.ts`).

---

## Database migrations

- Every schema / SQL change is a **new file** under `../supabase/migrations/` (repo root; e.g. `003_…sql`, `004_…sql`).
- **Never** edit an already-created migration that may have been applied — append a new migration instead.
- Keep migrations SQL-only; name them descriptively after the change.
- **Keep [`docs/database.md`](docs/database.md) in sync** with every migration and any other database change (tables, columns, constraints, RPCs, triggers, RLS policies, enums). Update that English doc in the **same change** as the SQL — do not leave schema docs stale.
- **Always verify the target Supabase project before pushing.** Before any remote DB command (`supabase db push`, `supabase db reset --linked`, `supabase link`, migration apply/repair against a remote, MCP SQL against a linked project, etc.), confirm which project/ref you are targeting (`supabase projects list`, `supabase link --project-ref …`, `.supabase` / linked project config, and/or the dashboard URL). Do **not** push migrations or run destructive SQL until the project name and ref match the intended environment (local vs staging vs production). If ambiguous, ask the user which project to use.

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
  - Examples: email → lowercase + email regex + max 254; phone → national 10 digits in UI, store E.164 with country code (`+52…`); names → letters/spaces/safe punctuation + max length; passwords → min/max + no control characters; OTP → alphanumeric (or digits) with fixed length bounds.
  - Prefer reusing helpers from `lib/validation/schemas.ts` (`emailSchema`, `personNameSchema`, `entityNameSchema`, `phoneSchema`, `sanitizePhoneInput`, etc.) instead of ad-hoc `z.string()`.
  - Mirror limits on the client with `maxLength` / `pattern` / `inputMode` / client sanitizers (`sanitizePhoneInput`, `sanitizeEmailInput`, …) — server schema remains authoritative.
- **Show validation errors to the user** — never fail silently or with only a generic banner when a specific field is wrong.
  - Map Zod issues to per-field messages via `lib/validation/field-errors.ts` (`zodFieldErrors`) and dictionary copy (`validation.*` in `lib/i18n/dictionaries.ts`, plus landing contact errors when needed).
  - Return `{ fieldErrors?: Record<string, string>; error?: string }` from actions; render each message under the matching control with `FormField`’s `error` prop (`aria-invalid` / `role="alert"`).
  - Form-level `error` is for auth/server failures (wrong password, network, forbidden) — not a substitute for field errors.
- **Sanitize / escape outputs**: rely on React text escaping; never inject unsanitized user HTML (`dangerouslySetInnerHTML`) with member/gym-provided content. Encode when embedding user data in URLs, QR payloads, or emails.
- Trim strings; reject empty required fields; constrain lengths and enums (`Role`, `PaymentMethod`, etc.).

---

## Backend: Server Actions, APIs, errors

- **Default**: mutations and privileged reads via **Next.js Server Actions** or server components using `lib/supabase/server.ts`. Do not call Supabase with elevated privileges from the client.
- **Prefer work in Postgres / Supabase, not in the app.** If a query, filter, aggregate, sort, join, or **pagination** can run in SQL (PostgREST `.range` / `.limit` + `count`, RPC, view, or generated column), do it **server-side in the database** instead of loading large result sets into Next.js/React and slicing, filtering, or summarizing in memory. Examples: paginate list tables with `.range(from, to)` and `{ count: "exact" }`; compute monthly payment totals with a filtered select (or SQL aggregate), not by summing a huge client-fetched array; filter active/expired memberships with `expires_at` predicates rather than fetching everyone and filtering in JS.
- **Route Handlers** (`app/**/route.ts`): use for webhooks, OAuth/confirm callbacks, or public HTTP APIs — follow **REST** conventions (correct methods, status codes, JSON error body). Do not add GraphQL unless explicitly requested.
- **Service role** (`lib/supabase/admin.ts`): only on the server, only when RLS/session cannot do the job; never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- **Errors**: handle consistently — map failures to dictionary messages; return `{ error: string }` (or a shared result type) from actions; do not leak raw DB/Auth stack traces to the UI. Log server-side detail when useful; show safe copy to users.
- After successful mutations: `revalidatePath` / `redirect` as appropriate; keep success and failure paths explicit and clean (no silent `catch`).

---

## Performance: requests, RSC, Supabase

Treat every network round-trip (browser → Next.js RSC/actions, Next.js → Supabase) as expensive. Prefer **fewer, intentional** fetches over chatty UI.

### Do not spam RSC / soft navigations

- **Never** put `router.refresh()`, `router.push`, or `router.replace` in a `useEffect` whose deps include unstable identities (inline `onSuccess={() => …}`, new object/array literals, etc.). That pattern re-fires after every refresh and floods DevTools with `?_rsc=` requests.
- After a Server Action that already calls `revalidatePath` / `revalidateTag`, **do not** also call `router.refresh()` unless you have a concrete reason the auto update did not cover the UI. Duplicate refresh = duplicate RSC + duplicate Supabase work.
- Prefer `useEffectEvent` (or a ref) for success callbacks so effects depend only on **action result** (`state?.success`), not on parent-rendered closures.
- Skip no-op navigations: if the target href equals the current path+query, do not `router.push` again.
- Opening a dialog / toggling local UI state must **not** trigger page data reloads. Mount forms lazily when open; do not refresh the route on open/close.
- Avoid broad `revalidatePath("/", "layout")` when a page-scoped path is enough — layout revalidation multiplies work for every open view.

### Supabase / Postgres cost

- **Prefer work in Postgres** (filters, joins, aggregates, `.range` pagination + `count`) — already required above. Do not load large sets into the app to filter in JS.
- Select **only needed columns**; avoid `select('*')` and deep embeds you do not render.
- One user gesture → ideally **one** mutation round-trip (or a single RPC). Do not N+1 query in loops from Server Components or actions.
- Do not create `createClient()` / service-role clients inside hot loops; reuse the request-scoped client.
- Cache thoughtfully: do not disable caching or force dynamic rendering without need. Do not poll Supabase from the client on an interval unless the product explicitly needs live updates (prefer Realtime sparingly, or refresh after mutations).

### Verify before shipping chatty UI

- After mutations and dialog flows, check the Network tab: you should **not** see a burst of identical `?_rsc=` requests for the same page from a single click.
- If you see a storm, look first for `router.refresh` / `push` in effects and for duplicate `revalidatePath` + `refresh`.

---

## UI: design system, responsive, a11y

- Use shared design tokens / CSS variables (`--color-*`) and existing Tailwind patterns — no one-off color systems per page.
- **Responsive** by default (mobile → desktop); auth and app layouts must work on small screens.
- **Accessibility basics**: label every input (`htmlFor` / wrapping label), meaningful button text, `aria-label` for icon-only controls, visible focus, sufficient contrast, do not rely on color alone for errors.
- Prefer semantic HTML (`button`, `label`, `nav`, headings in order).
- **Disable submit buttons** until required form fields are filled (client-side). Do not leave primary submit actions enabled on empty required forms (auth, onboarding, and app forms).

---

## Responsive UI / UX (must follow)

Every UI change and new feature must be **responsive, clear, and useful** on phone and desktop — not desktop-only with a squeezed fallback.

- **Mobile-first:** design for ~375px width first, then `sm` / `md` / `lg`. Spot-check both narrow and desktop before shipping.
- **Use the shared ops shell:** desktop = collapsible sidebar (`md+`); mobile = bottom tabs + **More** sheet. Do **not** invent per-page nav, duplicate sidebars, or one-off menus.
- **Thumb reach:** gym-floor actions (check-in, members, classes) stay in primary tabs when the role allows — do not bury them only in overflow.
- **Touch targets:** interactive controls ≥ ~44×44px; fixed bars respect `safe-area-inset-*`.
- **Layout:** stack columns on small screens; avoid locked multi-column grids or `min-w-[…rem]` tables without a mobile alternative (cards, stacked rows, or intentional horizontal scroll with a clear purpose).
- **Density:** tighter padding on mobile (`p-4`); leave clearance for the bottom tab bar (`pb` / safe-area) so content is not covered.
- **One job per section:** one primary action path; no competing chrome or decorative card clutter.
- **Pretty via the system:** reuse `--color-*`, shared `Input` / `Button` / `Dialog` / form fields — no one-off “pretty” forks or hardcoded marketing gradients in the product app.
- **i18n + a11y still required:** all copy in `es` + `en`; `aria-current` on nav; labels on icon-only controls.

See also `.cursor/rules/responsive-ux.mdc`.

---

## Auth, tenancy, security

- Respect RLS and tenant scoping; never query “all tenants” from user-scoped clients.
- Check session / role via `lib/auth/*` before privileged UI or actions.
- Secrets only in server env (`SUPABASE_SERVICE_ROLE_KEY`, etc.); public keys only via `NEXT_PUBLIC_*` as already patterned in `lib/supabase/env.ts`.
