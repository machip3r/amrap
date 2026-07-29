# Supabase Auth email templates (AMRAP)

Source of truth for hosted Auth emails. Gym **team/member invites** sent via Resend live in [`src/lib/email/invite-templates.ts`](../../src/lib/email/invite-templates.ts) — keep both visually aligned (coral `#ff6b6b`, card layout, system fonts).

Docs: [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates).

## Why OTP-first

AMRAP signup confirmation uses the in-app OTP UI (`ConfirmEmailForm`). Templates lead with `{{ .Token }}` so users are not forced to click a link (and to avoid email-client link prefetch consuming the token).

## Locale

Signup stores `user_metadata.locale` (`es` | `en`). Templates branch with:

```go
{{ if eq .Data.locale "en" }}
  …
{{ else }}
  … Spanish (default)
{{ end }}
```

If `locale` is missing, Spanish copy is shown.

## Files → Dashboard

| File | Auth → Email Templates |
| ---- | ---------------------- |
| `confirmation.html` | Confirm sign up |
| `magic_link.html` | Magic Link |
| `recovery.html` | Reset password |
| `invite.html` | Invite user |
| `email_change.html` | Change email address |
| `reauthentication.html` | Reauthentication |
| `notifications/password_changed.html` | Password changed |
| `notifications/email_changed.html` | Email address changed |

Subjects: see `subjects.json` → use `dashboard_default` (Spanish) in the Dashboard subject field. Body HTML is bilingual via `.Data.locale`.

## Apply to hosted project

1. Open [Auth → Email Templates](https://supabase.com/dashboard/project/_/auth/templates).
2. For each template: paste **Subject** from `subjects.json` and **Body** from the matching `.html` file (full file).
3. Enable security notification templates you want (password / email changed).
4. Send a test signup and confirm the OTP email matches.

Or patch via [Management API](https://supabase.com/docs/guides/auth/auth-email-templates#editing-email-templates) (`mailer_subjects_*` / `mailer_templates_*_content`).

## Local CLI (optional)

If you add a `supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Tu código AMRAP: confirma tu correo"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.magic_link]
subject = "Tu código de acceso AMRAP"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.recovery]
subject = "Restablece tu contraseña de AMRAP"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.invite]
subject = "Te invitaron a AMRAP"
content_path = "./supabase/templates/invite.html"

[auth.email.template.email_change]
subject = "Confirma tu nuevo correo en AMRAP"
content_path = "./supabase/templates/email_change.html"

[auth.email.template.reauthentication]
subject = "{{ .Token }} es tu código de verificación AMRAP"
content_path = "./supabase/templates/reauthentication.html"
```

Then `supabase stop && supabase start`.

## Maintenance

- Edit HTML here first, then re-paste into the Dashboard (hosted templates are not auto-synced from git).
- Keep brand color `#ff6b6b` and the OTP card pattern consistent with Resend invite emails.
- Prefer `{{ .Token }}` for flows that use the in-app OTP UI; keep `{{ .ConfirmationURL }}` as a secondary option where useful.
