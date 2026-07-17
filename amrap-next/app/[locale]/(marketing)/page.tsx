import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getLandingDictionary } from "@/lib/i18n/landing-dictionaries";
import { LandingPage } from "@/components/landing/landing-page";

export default async function MarketingHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getLandingDictionary(locale);

  return <LandingPage locale={locale} d={d} />;
}
