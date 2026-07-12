import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Dumbbell } from "lucide-react";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type InviteRole = "trainer" | "staff";

function parseRole(raw: string | undefined): InviteRole | null {
  if (raw === "trainer" || raw === "staff") return raw;
  return null;
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_staff")) {
    redirect(`/${locale}/dashboard`);
  }

  const d = getDictionary(locale);
  const invite = parseRole(sp.invite);
  const title =
    invite === "trainer"
      ? d.dashboard.quickNewTrainer
      : invite === "staff"
        ? d.dashboard.quickNewStaff
        : d.team.title;
  const Icon = invite === "staff" ? Briefcase : Dumbbell;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <Link
        href={`/${locale}/dashboard`}
        className="inline-flex w-fit items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {d.dashboard.title}
      </Link>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="font-title text-2xl font-bold text-[var(--color-text)]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{d.team.comingSoon}</p>
        <p className="mt-4 text-sm text-[var(--color-muted)]">{d.team.comingSoonHint}</p>
      </div>
    </div>
  );
}
