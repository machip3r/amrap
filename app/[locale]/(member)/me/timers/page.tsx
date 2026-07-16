import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { WorkoutTimer } from "@/components/timers/workout-timer";

export default async function MemberTimersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-title text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {d.timers.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.timers.subtitle}
        </p>
      </header>
      <WorkoutTimer locale={locale} />
    </div>
  );
}
