import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { ensureOrganizationAfterConfirm } from "@/lib/auth/ensure-organization";
import { getOnboardingState, getSessionUser } from "@/lib/auth/session";

/**
 * Creates the org after email confirm when it is still missing.
 * Cookie clears must run here (Route Handler), not in a Server Component render.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeRaw = searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(localeRaw) ? localeRaw : defaultLocale;

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const before = await getOnboardingState();
  if (before?.organizationId) {
    redirect(`/${locale}/onboarding`);
  }

  const result = await ensureOrganizationAfterConfirm(user.email ?? "user");
  if (!result.ok) {
    console.error("ensure-organization route", result.error);
    redirect(`/${locale}/onboarding?error=org`);
  }

  // Trust RPC/bootstrap result — do not re-query in the same request after
  // cookie mutations (session re-read can falsely look like a missing org).
  redirect(`/${locale}/onboarding`);
}
