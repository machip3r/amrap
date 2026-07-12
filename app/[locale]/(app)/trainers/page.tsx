import { redirect, notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function TrainersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_staff")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header>
        <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {d.trainers.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.trainers.subtitle}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          <Dumbbell className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="font-title text-xl font-bold text-[var(--color-text)]">
          {d.trainers.comingSoon}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-muted)]">
          {d.trainers.comingSoonHint}
        </p>
      </section>
    </div>
  );
}
