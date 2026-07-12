import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { canCreatePlan, maxActivePlans } from "@/lib/plans/limits";
import { PlansClient } from "@/components/plans-client";

export default async function PlansPage({
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
  if (!canInWorkspace(workspace, "manage_plans")) {
    return (
      <p className="text-[var(--color-muted)]">{getDictionary(locale).common.forbidden}</p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const [{ data: planRows }, { data: membershipRows }] = await Promise.all([
    supabase
      .from("plans")
      .select("id, name, price, duration_days, is_active, created_at")
      .eq("gym_id", workspace.gymId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("memberships")
      .select("plan_id")
      .eq("gym_id", workspace.gymId)
      .not("plan_id", "is", null),
  ]);

  const memberCounts = new Map<string, number>();
  for (const row of membershipRows ?? []) {
    if (!row.plan_id) continue;
    memberCounts.set(row.plan_id, (memberCounts.get(row.plan_id) ?? 0) + 1);
  }

  const plans = (planRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    duration_days: p.duration_days,
    is_active: p.is_active !== false,
    member_count: memberCounts.get(p.id) ?? 0,
  }));

  const activeCount = plans.filter((p) => p.is_active).length;
  const maxPlans = maxActivePlans(workspace.planTier);
  const canAdd = canCreatePlan(workspace.planTier, activeCount);

  const errorMessage =
    sp.error === "limit"
      ? d.plans.planLimit
      : sp.error
        ? d.plans.error
        : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      {errorMessage ? (
        <p
          className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <PlansClient
        locale={locale}
        plans={plans}
        canAdd={canAdd}
        activeCount={activeCount}
        maxPlans={maxPlans}
        labels={{
          subtitle: d.plans.subtitle,
          newPlan: d.plans.newPlan,
          planName: d.plans.planName,
          price: d.plans.price,
          durationDays: d.plans.durationDays,
          save: d.plans.save,
          cancel: d.plans.cancel,
          close: d.plans.close,
          edit: d.plans.edit,
          archive: d.plans.archive,
          restore: d.plans.restore,
          active: d.plans.active,
          archived: d.plans.archived,
          noPlans: d.plans.noPlans,
          membersEnrolled: d.plans.membersEnrolled,
          perDays: d.plans.perDays,
          perMonth: d.plans.perMonth,
          perMonths: d.plans.perMonths,
          createTitle: d.plans.createTitle,
          createDescription: d.plans.createDescription,
          editTitle: d.plans.editTitle,
          editDescription: d.plans.editDescription,
          limitReached: d.plans.limitReached,
          limitReachedHint: d.plans.limitReachedHint,
          upgradePlans: d.plans.upgradePlans,
          quotaLabel: d.plans.quotaLabel,
          freemium: d.plans.freemium,
        }}
      />
    </div>
  );
}
