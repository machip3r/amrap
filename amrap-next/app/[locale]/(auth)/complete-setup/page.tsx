import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

/** Legacy route — onboarding stepper replaces complete-setup. */
export default async function CompleteSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  redirect(`/${locale}/onboarding`);
}
