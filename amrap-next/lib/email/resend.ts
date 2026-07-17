import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: boolean; message: string };

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "AMRAP <onboarding@resend.dev>";
}

/**
 * Sends a transactional email via Resend.
 * When `RESEND_API_KEY` is missing, skips send and returns `{ ok: false, skipped: true }`.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    console.warn("sendEmail: RESEND_API_KEY missing — email skipped", {
      to: input.to,
      subject: input.subject,
    });
    return {
      ok: false,
      skipped: true,
      message: "RESEND_API_KEY missing",
    };
  }

  const { data, error } = await client.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    console.error("sendEmail", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true, id: data?.id };
}
