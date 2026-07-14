import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { paymentKindFromDb, paymentMethodFromDb } from "@/lib/validation/db-enums";
import {
  MEMBERSHIP_LIST_SELECT,
  mapMembershipRow,
} from "@/lib/members/queries";
import { PaymentsPageClient } from "@/components/payments-page-client";

export default async function PaymentsPage({
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
  if (!canInWorkspace(workspace, "record_payment")) {
    return (
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();

  const [
    { data: membershipRows },
    { data: planRows },
    { data: gymRow },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select(MEMBERSHIP_LIST_SELECT)
      .eq("gym_id", workspace.gymId)
      .order("created_at", { ascending: false }),
    supabase
      .from("plans")
      .select("id, name, price, duration_days")
      .eq("gym_id", workspace.gymId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("gyms")
      .select("day_pass_price")
      .eq("id", workspace.gymId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount, method, created_at, membership_id, kind, plan_id, plans(name)")
      .eq("gym_id", workspace.gymId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const members = (membershipRows ?? [])
    .map((r) => mapMembershipRow(r as Parameters<typeof mapMembershipRow>[0]))
    .filter((m): m is NonNullable<typeof m> => m != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const plans = (planRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    duration_days: p.duration_days,
  }));

  const dayPassPrice =
    gymRow?.day_pass_price != null ? Number(gymRow.day_pass_price) : null;

  const memberById = new Map(
    members.map((m) => [m.id, { name: m.name, email: m.email }] as const),
  );

  function methodLabel(rawMethod: string) {
    const m = paymentMethodFromDb(rawMethod);
    if (m === "cash") return d.payments.cash;
    if (m === "transfer") return d.payments.transfer;
    return rawMethod;
  }

  function planNameFromJoin(
    plansJoin: { name: string } | { name: string }[] | null | undefined,
  ) {
    if (!plansJoin) return null;
    if (Array.isArray(plansJoin)) return plansJoin[0]?.name ?? null;
    return plansJoin.name ?? null;
  }

  return (
    <>
      {sp.error ? (
        <p
          className="mx-auto mb-5 w-full max-w-6xl rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {d.payments.error}
        </p>
      ) : null}

      <PaymentsPageClient
        locale={locale}
        title={d.payments.title}
        subtitle={d.payments.subtitle}
        noMembersHint={d.payments.noMembers}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
        }))}
        plans={plans}
        dayPassPrice={dayPassPrice}
        payments={(payments ?? []).map((p) => {
          const kind = paymentKindFromDb(p.kind);
          const joinedName = planNameFromJoin(
            p.plans as { name: string } | { name: string }[] | null,
          );
          return {
            id: p.id,
            memberName: memberById.get(p.membership_id)?.name ?? p.membership_id,
            amount: Number(p.amount),
            methodLabel: methodLabel(p.method),
            createdAt: p.created_at,
            kind,
            kindLabel:
              kind === "day_pass" ? d.payments.kindDayPass : d.payments.kindPlan,
            planName: kind === "plan" ? joinedName : null,
          };
        })}
        labels={{
          date: d.payments.date,
          member: d.payments.member,
          amount: d.payments.amount,
          method: d.payments.method,
          concept: d.payments.kindLabel,
          noPayments: d.payments.noPayments,
          noResults: d.payments.noResults,
          searchPlaceholder: d.payments.searchPlaceholder,
          reload: d.payments.reload,
          showing: d.payments.showing,
          newBadge: d.payments.newBadge,
        }}
      />
    </>
  );
}
