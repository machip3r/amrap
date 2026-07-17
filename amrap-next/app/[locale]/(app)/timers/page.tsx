import { redirect, notFound } from "next/navigation";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { TimerApp } from "@/components/timers/timer-app";

export default async function OpsTimersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "use_timers")) {
    return (
      <p className="text-[var(--color-muted)]">{d.common.forbidden}</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <TimerApp locale={locale} />
    </div>
  );
}
