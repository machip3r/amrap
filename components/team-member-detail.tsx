import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Dumbbell,
  Mail,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadTeamMemberById } from "@/lib/team/queries";
import { TeamMemberRemoveSection } from "@/components/team-member-remove-section";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type ListRole = "trainer" | "staff";

export async function TeamMemberDetailPage({
  locale: raw,
  id,
  listRole,
}: {
  locale: string;
  id: string;
  listRole: ListRole;
}) {
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_staff")) {
    return (
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
    );
  }

  const d = getDictionary(locale);
  const copy = listRole === "trainer" ? d.trainers : d.staffPage;
  const listHref = `/${locale}/${listRole === "trainer" ? "trainers" : "staff"}`;
  const dbRole = listRole === "trainer" ? "TRAINER" : "STAFF";

  const supabase = await createClient();
  const member = await loadTeamMemberById(
    supabase,
    workspace.gymId,
    id,
    dbRole,
  );
  if (!member) notFound();

  const isSelf = member.userId === workspace.userId;
  const RoleIcon = listRole === "trainer" ? Dumbbell : Briefcase;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <Link
          href={listHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {d.common.back}
        </Link>
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]">
            {initials(member.name)}
          </span>
          <div className="min-w-0">
            <h1 className="font-title truncate text-3xl font-bold tracking-tight text-[var(--color-text)]">
              {member.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text)]">
                <RoleIcon className="h-3.5 w-3.5" aria-hidden />
                {listRole === "trainer" ? d.nav.trainers : d.nav.staff}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  member.inviteStatus === "pending"
                    ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                    : member.inviteStatus === "cancelled"
                      ? "bg-[var(--color-muted)]/20 text-[var(--color-muted)]"
                      : "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                }`}
              >
                {member.inviteStatus === "pending"
                  ? d.inviteStatus.pending
                  : member.inviteStatus === "cancelled"
                    ? d.inviteStatus.cancelled
                    : d.inviteStatus.accepted}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
          {copy.title}
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <Mail
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
              aria-hidden
            />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                {d.members.email}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
                {member.email ?? "—"}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
              aria-hidden
            />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                {copy.phone}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
                {member.phone ?? "—"}
              </dd>
            </div>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <CalendarDays
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
              aria-hidden
            />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                {copy.joined}
              </dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-[var(--color-text)]">
                {new Date(member.createdAt).toLocaleDateString(locale, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      {!isSelf ? (
        <TeamMemberRemoveSection
          locale={locale}
          listRole={listRole}
          teamMemberId={member.id}
          memberName={member.name}
        />
      ) : null}
    </div>
  );
}
