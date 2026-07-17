import type { Locale } from "$lib/i18n/config";

type TeamInviteCopy = {
  subject: string;
  headline: string;
  body: string;
  cta: string;
  footer: string;
};

type MemberInviteCopy = {
  subject: string;
  headline: string;
  body: string;
  cta: string;
  footer: string;
};

function teamCopy(
  locale: Locale,
  gymName: string,
  roleLabel: string,
): TeamInviteCopy {
  if (locale === "en") {
    return {
      subject: `You're invited to join ${gymName} on AMRAP`,
      headline: `Invitation to ${gymName}`,
      body: `You've been invited as ${roleLabel}. Open the link below to review the invitation — you can accept or decline.`,
      cta: "Review invitation",
      footer: "If you didn't expect this email, you can ignore it.",
    };
  }
  return {
    subject: `Te invitaron a unirte a ${gymName} en AMRAP`,
    headline: `Invitación a ${gymName}`,
    body: `Te invitaron como ${roleLabel}. Abre el enlace para revisar la invitación — puedes aceptar o rechazar.`,
    cta: "Revisar invitación",
    footer: "Si no esperabas este correo, puedes ignorarlo.",
  };
}

function memberCopy(locale: Locale, gymName: string): MemberInviteCopy {
  if (locale === "en") {
    return {
      subject: `You're invited to ${gymName} on AMRAP`,
      headline: `Invitation to ${gymName}`,
      body: "Your membership is ready. Open the link below to review the invitation — you can accept or decline, then set up your account.",
      cta: "Review invitation",
      footer: "If you didn't expect this email, you can ignore it.",
    };
  }
  return {
    subject: `Te invitaron a ${gymName} en AMRAP`,
    headline: `Invitación a ${gymName}`,
    body: "Tu membresía ya está lista. Abre el enlace para revisar la invitación — puedes aceptar o rechazar y luego activar tu cuenta.",
    cta: "Revisar invitación",
    footer: "Si no esperabas este correo, puedes ignorarlo.",
  };
}

function wrapEmail(opts: {
  headline: string;
  body: string;
  cta: string;
  href: string;
  footer: string;
}): string {
  const safeHref = opts.href.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:28px 24px;border:1px solid #e4e4e7;">
            <tr>
              <td style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#e11d48;">
                AMRAP
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:22px;font-weight:700;color:#18181b;line-height:1.3;">
                ${escapeHtml(opts.headline)}
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;font-size:15px;line-height:1.55;color:#3f3f46;">
                ${escapeHtml(opts.body)}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <a href="${safeHref}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:8px;">
                  ${escapeHtml(opts.cta)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:12px;line-height:1.5;color:#71717a;">
                ${escapeHtml(opts.footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTeamInviteEmail(opts: {
  locale: Locale;
  gymName: string;
  roleLabel: string;
  acceptUrl: string;
}) {
  const copy = teamCopy(opts.locale, opts.gymName, opts.roleLabel);
  return {
    subject: copy.subject,
    html: wrapEmail({
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
      href: opts.acceptUrl,
      footer: copy.footer,
    }),
  };
}

export function buildMemberInviteEmail(opts: {
  locale: Locale;
  gymName: string;
  acceptUrl: string;
}) {
  const copy = memberCopy(opts.locale, opts.gymName);
  return {
    subject: copy.subject,
    html: wrapEmail({
      headline: copy.headline,
      body: copy.body,
      cta: copy.cta,
      href: opts.acceptUrl,
      footer: copy.footer,
    }),
  };
}

export function buildExistingUserTeamEmail(opts: {
  locale: Locale;
  gymName: string;
  roleLabel: string;
  loginUrl: string;
}) {
  const locale = opts.locale;
  if (locale === "en") {
    return {
      subject: `You've been added to ${opts.gymName} on AMRAP`,
      html: wrapEmail({
        headline: `Invitation to ${opts.gymName}`,
        body: `You've been invited as ${opts.roleLabel}. Open the link to review the invitation — you can accept or decline.`,
        cta: "Review invitation",
        href: opts.loginUrl,
        footer: "If you didn't expect this email, you can ignore it.",
      }),
    };
  }
  return {
    subject: `Te agregaron a ${opts.gymName} en AMRAP`,
    html: wrapEmail({
      headline: `Invitación a ${opts.gymName}`,
      body: `Te invitaron como ${opts.roleLabel}. Abre el enlace para revisar la invitación — puedes aceptar o rechazar.`,
      cta: "Revisar invitación",
      href: opts.loginUrl,
      footer: "Si no esperabas este correo, puedes ignorarlo.",
    }),
  };
}

export function buildExistingUserMemberEmail(opts: {
  locale: Locale;
  gymName: string;
  loginUrl: string;
}) {
  const locale = opts.locale;
  if (locale === "en") {
    return {
      subject: `Your membership at ${opts.gymName} is ready`,
      html: wrapEmail({
        headline: `Invitation to ${opts.gymName}`,
        body: "Open the link to review the invitation — you can accept or decline, then see your membership and QR.",
        cta: "Review invitation",
        href: opts.loginUrl,
        footer: "If you didn't expect this email, you can ignore it.",
      }),
    };
  }
  return {
    subject: `Tu membresía en ${opts.gymName} está lista`,
    html: wrapEmail({
      headline: `Invitación a ${opts.gymName}`,
      body: "Abre el enlace para revisar la invitación — puedes aceptar o rechazar y luego ver tu membresía y QR.",
      cta: "Revisar invitación",
      href: opts.loginUrl,
      footer: "Si no esperabas este correo, puedes ignorarlo.",
    }),
  };
}
