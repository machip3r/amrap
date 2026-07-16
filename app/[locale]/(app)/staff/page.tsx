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

export default async function StaffPage({
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
    "STAFF",
    { page, q },
  );

  return (
    <TeamPageClient
      locale={locale}
      title={d.staffPage.title}
      subtitle={d.staffPage.subtitle}
      newLabel={d.staffPage.newStaff}
      checkInHistoryLabel={d.checkin.viewAllCheckIns}
      showCheckInHistory={canInWorkspace(workspace, "checkin")}
      listRole="staff"
      members={members}
      currentUserId={workspace.userId}
      meta={meta}
      q={q}
      labels={{
        name: d.members.name,
        email: d.members.email,
        joined: d.staffPage.joined,
        actions: d.staffPage.actions,
        remove: d.staffPage.remove,
        confirmRemove: d.staffPage.confirmRemove,
        noRows: d.staffPage.noStaff,
        noResults: d.staffPage.noResults,
        searchPlaceholder: d.staffPage.searchPlaceholder,
        showing: d.staffPage.showing,
        reload: d.staffPage.reload,
        newBadge: d.staffPage.newBadge,
        view: d.staffPage.view,
        previous: d.common.previous,
        next: d.common.next,
      }}
    />
  );
}
