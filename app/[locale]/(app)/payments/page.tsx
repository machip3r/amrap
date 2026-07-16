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
import { listPaymentsPage } from "@/lib/payments/queries";
import { PaymentsPageClient } from "@/components/payments-page-client";
import { parsePage, sanitizeSearchTerm } from "@/lib/pagination";

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfLocalMonth(d: Date) {
  const x = startOfLocalDay(d);
  x.setDate(1);
  return x;
}

function sumAmounts(
  rows: { amount: number | string; kind?: string | null; created_at: string }[],
  predicate?: (row: {
    amount: number | string;
    kind?: string | null;
    created_at: string;
  }) => boolean,
) {
  let total = 0;
  let count = 0;
  for (const row of rows) {
    if (predicate && !predicate(row)) continue;
    total += Number(row.amount);
    count += 1;
  }
  return { total, count };
}

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; page?: string; q?: string }>;
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

  const now = new Date();
  const monthStartIso = startOfLocalMonth(now).toISOString();
  const todayStartIso = startOfLocalDay(now).toISOString();
  const page = parsePage(sp.page);
  const q = sanitizeSearchTerm(sp.q ?? "");

  const [
    { data: membershipRows },
    { data: planRows },
    { data: gymRow },
    { payments, meta },
    { data: monthPaymentRows },
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
    listPaymentsPage(supabase, workspace.gymId, { page, q }),
    supabase
      .from("payments")
      .select("amount, kind, created_at")
      .eq("gym_id", workspace.gymId)
      .gte("created_at", monthStartIso)
      .order("created_at", { ascending: false }),
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

  const monthRows = monthPaymentRows ?? [];
  const month = sumAmounts(monthRows);
  const today = sumAmounts(
    monthRows,
    (row) => row.created_at >= todayStartIso,
  );
  const plansMonth = sumAmounts(
    monthRows,
    (row) => paymentKindFromDb(row.kind) === "plan",
  );
  const dayPassMonth = sumAmounts(
    monthRows,
    (row) => paymentKindFromDb(row.kind) === "day_pass",
  );

  function methodLabel(rawMethod: string) {
    const m = paymentMethodFromDb(rawMethod);
    if (m === "cash") return d.payments.cash;
    if (m === "transfer") return d.payments.transfer;
    return rawMethod;
  }

  function withCount(template: string, count: number) {
    return template.replace("{count}", String(count));
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
        meta={meta}
        q={q}
        stats={{
          monthTotal: month.total,
          monthHint: withCount(d.payments.statMonthHint, month.count),
          todayTotal: today.total,
          todayHint: withCount(d.payments.statTodayHint, today.count),
          plansTotal: plansMonth.total,
          plansHint: withCount(d.payments.statPlansHint, plansMonth.count),
          dayPassTotal: dayPassMonth.total,
          dayPassHint: withCount(
            d.payments.statDayPassHint,
            dayPassMonth.count,
          ),
        }}
        payments={payments.map((p) => {
          const kind = p.kind;
          return {
            id: p.id,
            memberName: p.member_name ?? p.membership_id,
            amount: p.amount,
            methodLabel: methodLabel(p.method),
            createdAt: p.created_at,
            kind,
            kindLabel:
              kind === "day_pass" ? d.payments.kindDayPass : d.payments.kindPlan,
            planName: kind === "plan" ? p.plan_name : null,
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
          previous: d.common.previous,
          next: d.common.next,
          statMonth: d.payments.statMonth,
          statToday: d.payments.statToday,
          statPlans: d.payments.statPlans,
          statDayPass: d.payments.statDayPass,
        }}
      />
    </>
  );
}
