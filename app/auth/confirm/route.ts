import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { ensureOrganizationAfterConfirm } from "@/lib/auth/ensure-organization";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { invitePath } from "@/lib/auth/invite-decision";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/** Only allow relative in-app paths (open-redirect safe). */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return `/${defaultLocale}/onboarding`;
  }
  return raw;
}

function localeFromPath(path: string): Locale {
  const first = path.split("/").filter(Boolean)[0];
  return isLocale(first ?? "") ? (first as Locale) : defaultLocale;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));
  const locale = localeFromPath(next);

  const supabase = await createClient();
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  // Already signed in — do not re-consume invite/OTP; land in the right app.
  if (existingUser) {
    redirect(await resolvePostAuthPath(locale));
  }

  if (token_hash && typeRaw && OTP_TYPES.has(typeRaw)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: typeRaw as EmailOtpType,
      token_hash,
    });
    if (!error) {
      const email = data.user?.email ?? "";
      // Org bootstrap is only for self-serve signup — not team/member invites.
      if (email && typeRaw === "signup") {
        await ensureOrganizationAfterConfirm(email);
      }

      // Password recovery / email change keep an explicit next target.
      if (typeRaw === "recovery" || typeRaw === "email_change") {
        redirect(next);
      }

      // Team / member invite links decide accept vs decline next.
      if (typeRaw === "invite" || typeRaw === "magiclink") {
        redirect(invitePath(locale));
      }

      redirect(await resolvePostAuthPath(locale));
    }
    console.error("auth/confirm", error.message);
  }

  redirect(`/${locale}/login`);
}
