import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MembersPageClient } from "@/components/members-page-client";
import { listMembershipsPage } from "@/lib/members/queries";
import { parsePage, sanitizeSearchTerm } from "@/lib/pagination";

function parseStatus(raw: string | undefined): "all" | "active" | "expired" {
  if (raw === "active" || raw === "expired") return raw;
  return "all";
}

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    page?: string;
    q?: string;
    status?: string;
    plan?: string;
  }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_members")) {
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
  const status = parseStatus(sp.status);
  const planId = sp.plan?.trim() || "all";

  const [{ members, meta }, { data: planRows }] = await Promise.all([
    listMembershipsPage(supabase, workspace.gymId, {
      page,
      q,
      status,
      planId,
    }),
    supabase
      .from("plans")
      .select("id, name, price, duration_days, is_active")
      .eq("gym_id", workspace.gymId)
      .order("created_at", { ascending: false }),
  ]);

  const plans = (planRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    duration_days: p.duration_days,
    is_active: p.is_active !== false,
  }));
  const activePlans = plans
    .filter((p) => p.is_active)
    .map(({ id, name, price, duration_days }) => ({
      id,
      name,
      price,
      duration_days,
    }));

  return (
    <>
      {sp.error ? (
        <p
          className="mx-auto mb-5 w-full max-w-6xl rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {d.members.error}
        </p>
      ) : null}

      <MembersPageClient
        locale={locale}
        title={d.members.title}
        subtitle={d.members.subtitle}
        newMemberLabel={d.members.newMember}
        checkInHistoryLabel={d.checkin.viewAllCheckIns}
        showCheckInHistory={canInWorkspace(workspace, "checkin")}
        members={members}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
        activePlans={activePlans}
        meta={meta}
        filters={{ q, status, planId }}
        labels={{
          name: d.members.name,
          email: d.members.email,
          plan: d.members.plan,
          noPlan: d.members.noPlan,
          status: d.members.status,
          expires: d.members.expires,
          active: d.members.active,
          expired: d.members.expired,
          actions: d.members.actions,
          view: d.members.view,
          noMembers: d.members.noMembers,
          noResults: d.members.noResults,
          searchPlaceholder: d.members.searchPlaceholder,
          filterAll: d.members.filterAll,
          filterActive: d.members.filterActive,
          filterExpired: d.members.filterExpired,
          filterPlan: d.members.filterPlan,
          filterPlanAll: d.members.filterPlanAll,
          showing: d.members.showing,
          reload: d.members.reload,
          newBadge: d.members.newBadge,
          previous: d.common.previous,
          next: d.common.next,
        }}
      />
    </>
  );
}
