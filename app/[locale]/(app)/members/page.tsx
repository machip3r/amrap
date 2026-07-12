import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { RegisterUserButton } from "@/components/register-user-dialog";
import { MembersClient } from "@/components/members-client";
import {
  MEMBERSHIP_LIST_SELECT,
  mapMembershipRow,
} from "@/lib/members/queries";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_members")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const [{ data: rows }, { data: planRows }] = await Promise.all([
    supabase
      .from("memberships")
      .select(MEMBERSHIP_LIST_SELECT)
      .eq("gym_id", workspace.gymId)
      .order("created_at", { ascending: false }),
    supabase
      .from("plans")
      .select("id, name, price, duration_days, is_active")
      .eq("gym_id", workspace.gymId)
      .order("created_at", { ascending: false }),
  ]);

  const members = (rows ?? [])
    .map((r) => mapMembershipRow(r as Parameters<typeof mapMembershipRow>[0]))
    .filter((m): m is NonNullable<typeof m> => m != null);

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {d.members.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {d.members.subtitle}
          </p>
        </div>
        <RegisterUserButton
          locale={locale}
          canManageMembers
          canManageStaff={false}
          plans={activePlans}
          defaultRole="member"
          allowedRoles={["member"]}
          label={d.members.newMember}
        />
      </header>

      {sp.error ? (
        <p
          className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {d.members.error}
        </p>
      ) : null}

      <MembersClient
        locale={locale}
        members={members}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
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
        }}
      />
    </div>
  );
}
