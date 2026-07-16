import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadTeamMembersPage } from "@/lib/team/queries";
import { TeamPageClient } from "@/components/team-page-client";
import { parsePage, sanitizeSearchTerm } from "@/lib/pagination";

export default async function TrainersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;

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
  const supabase = await createClient();
  const page = parsePage(sp.page);
  const q = sanitizeSearchTerm(sp.q ?? "");
  const { members, meta } = await loadTeamMembersPage(
    supabase,
    workspace.gymId,
    "TRAINER",
    { page, q },
  );

  return (
    <TeamPageClient
      locale={locale}
      title={d.trainers.title}
      subtitle={d.trainers.subtitle}
      newLabel={d.trainers.newTrainer}
      checkInHistoryLabel={d.checkin.viewAllCheckIns}
      showCheckInHistory={canInWorkspace(workspace, "checkin")}
      listRole="trainer"
      members={members}
      currentUserId={workspace.userId}
      meta={meta}
      q={q}
      labels={{
        name: d.members.name,
        email: d.members.email,
        joined: d.trainers.joined,
        actions: d.trainers.actions,
        remove: d.trainers.remove,
        confirmRemove: d.trainers.confirmRemove,
        noRows: d.trainers.noTrainers,
        noResults: d.trainers.noResults,
        searchPlaceholder: d.trainers.searchPlaceholder,
        showing: d.trainers.showing,
        reload: d.trainers.reload,
        newBadge: d.trainers.newBadge,
        view: d.trainers.view,
        previous: d.common.previous,
        next: d.common.next,
        invitePending: d.inviteStatus.pending,
        inviteAccepted: d.inviteStatus.accepted,
        inviteCancelled: d.inviteStatus.cancelled,
      }}
    />
  );
}
