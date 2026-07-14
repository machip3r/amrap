import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadTeamMembers } from "@/lib/team/queries";
import { TeamPageClient } from "@/components/team-page-client";

export default async function StaffPage({
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
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const members = await loadTeamMembers(supabase, workspace.gymId, "STAFF");

  return (
    <TeamPageClient
      locale={locale}
      title={d.staffPage.title}
      subtitle={d.staffPage.subtitle}
      newLabel={d.staffPage.newStaff}
      listRole="staff"
      members={members}
      currentUserId={workspace.userId}
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
      }}
    />
  );
}
