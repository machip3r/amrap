import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { TimerApp } from "@/components/timers/timer-app";

export default async function MemberTimersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return (
    <div className="w-full">
      <TimerApp locale={locale} />
    </div>
  );
}
