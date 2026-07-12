import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { ensureOrganizationAfterConfirm } from "@/lib/auth/ensure-organization";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));

  const localeFromNext = next.split("/").filter(Boolean)[0];
  const locale = isLocale(localeFromNext ?? "") ? localeFromNext : defaultLocale;

  if (token_hash && typeRaw && OTP_TYPES.has(typeRaw)) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type: typeRaw as EmailOtpType,
      token_hash,
    });
    if (!error) {
      const email = data.user?.email ?? "";
      if (email) {
        await ensureOrganizationAfterConfirm(email);
      }
      redirect(next);
    }
    console.error("auth/confirm", error.message);
  }

  redirect(`/${locale}/login`);
}
