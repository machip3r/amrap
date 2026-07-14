import Link from "next/link";
import type { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  LogIn,
  UserCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { memberStatusFromExpires } from "@/lib/members/dates";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";

const EXPIRING_WINDOW_DAYS = 7;
const CRITICAL_EXPIRING_DAYS = 3;
const ACCESS_LOG_LIMIT = 8;

type PersonEmbed = { full_name: string } | { full_name: string }[] | null;
type PlanEmbed = { name: string } | { name: string }[] | null;
type MembershipEmbed =
  | {
      expires_at: string;
      plans: PlanEmbed;
    }
  | {
      expires_at: string;
      plans: PlanEmbed;
    }[]
  | null;

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  accent: "primary" | "success" | "danger";
}) {
  const accentBar =
    accent === "primary"
      ? "bg-[var(--color-primary)]"
      : accent === "success"
        ? "bg-[var(--color-success)]"
        : "bg-[var(--color-danger)]";
  const iconWrap =
    accent === "primary"
      ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
      : accent === "success"
        ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
        : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]";
  const hintColor =
    accent === "danger"
      ? "text-[var(--color-danger)]"
      : "text-[var(--color-muted)]";

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className={`absolute left-0 top-0 h-1 w-16 rounded-br-md ${accentBar}`} />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </span>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconWrap}`}
        >
          {icon}
        </span>
      </div>
      <p className="font-title mt-4 text-4xl font-bold tracking-tight text-[var(--color-text)]">
        {value}
      </p>
      <p className={`mt-2 text-xs font-medium ${hintColor}`}>{hint}</p>
    </div>
  );
}

function WeeklyBars({
  days,
}: {
  days: { label: string; count: number; isToday: boolean }[];
}) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex h-52 items-end justify-between gap-2 sm:gap-3">
      {days.map((day) => {
        const heightPct = Math.max(8, Math.round((day.count / max) * 100));
        return (
          <div
            key={day.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="text-[10px] font-semibold tabular-nums text-[var(--color-muted)]">
              {day.count}
            </span>
            <div className="flex h-40 w-full items-end justify-center">
              <div
                className={`w-full max-w-10 rounded-t-md transition-colors ${
                  day.isToday
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-muted)]/25 dark:bg-[var(--color-muted)]/35"
                }`}
                style={{ height: `${heightPct}%` }}
                title={`${day.label}: ${day.count}`}
              />
            </div>
            <span
              className={`text-[11px] font-semibold ${
                day.isToday
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);

  const d = getDictionary(locale);
  const supabase = await createClient();
  const gymId = workspace.gymId;

  const now = new Date();
  const nowIso = now.toISOString();
  const todayStart = startOfLocalDay(now);
  const weekStart = addDays(todayStart, -6);
  const expiringEnd = addDays(now, EXPIRING_WINDOW_DAYS);
  const criticalEnd = addDays(now, CRITICAL_EXPIRING_DAYS);

  const [
    activeRes,
    checkInsTodayRes,
    expiringRes,
    weekCheckInsRes,
    recentRes,
    expiredAlertsRes,
    soonAlertsRes,
    planRowsRes,
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .gte("expires_at", nowIso),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .gte("checked_in_at", todayStart.toISOString()),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .gte("expires_at", nowIso)
      .lte("expires_at", expiringEnd.toISOString()),
    supabase
      .from("check_ins")
      .select("checked_in_at")
      .eq("gym_id", gymId)
      .gte("checked_in_at", weekStart.toISOString())
      .order("checked_in_at", { ascending: true }),
    supabase
      .from("check_ins")
      .select(
        `
        id,
        checked_in_at,
        membership_id,
        persons ( full_name ),
        memberships (
          expires_at,
          plans ( name )
        )
      `,
      )
      .eq("gym_id", gymId)
      .order("checked_in_at", { ascending: false })
      .limit(ACCESS_LOG_LIMIT),
    supabase
      .from("memberships")
      .select(
        `
        id,
        expires_at,
        persons ( full_name )
      `,
      )
      .eq("gym_id", gymId)
      .lt("expires_at", nowIso)
      .order("expires_at", { ascending: false })
      .limit(4),
    supabase
      .from("memberships")
      .select(
        `
        id,
        expires_at,
        persons ( full_name )
      `,
      )
      .eq("gym_id", gymId)
      .gte("expires_at", nowIso)
      .lte("expires_at", criticalEnd.toISOString())
      .order("expires_at", { ascending: true })
      .limit(4),
    supabase
      .from("plans")
      .select("id, name, price, duration_days")
      .eq("gym_id", gymId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const registerPlans = (planRowsRes.data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    price: Number(p.price),
    duration_days: p.duration_days as number,
  }));

  const activeCount = activeRes.count ?? 0;
  const checkInsToday = checkInsTodayRes.count ?? 0;
  const expiringCount = expiringRes.count ?? 0;

  const countsByDay = new Map<string, number>();
  for (const row of weekCheckInsRes.data ?? []) {
    const at = new Date(row.checked_in_at as string);
    const key = dayKey(at);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const weeklyDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return {
      label: weekdayFmt.format(day),
      count: countsByDay.get(dayKey(day)) ?? 0,
      isToday: dayKey(day) === dayKey(todayStart),
    };
  });

  const recentCheckIns = (recentRes.data ?? []).map((row) => {
    const person = firstEmbed(row.persons as PersonEmbed);
    const membership = firstEmbed(row.memberships as MembershipEmbed);
    const plan = firstEmbed(membership?.plans ?? null);
    const name = person?.full_name ?? "—";
    const expiresAt = membership?.expires_at ?? nowIso;
    const status = memberStatusFromExpires(expiresAt);
    return {
      id: row.id as string,
      membershipId: row.membership_id as string,
      name,
      initials: initials(name),
      time: new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(row.checked_in_at as string)),
      planName: plan?.name ?? d.dashboard.noPlan,
      status,
    };
  });

  type AlertItem = {
    id: string;
    name: string;
    kind: "expired" | "expiring";
  };

  const alerts: AlertItem[] = [
    ...(expiredAlertsRes.data ?? []).map((row) => {
      const person = firstEmbed(row.persons as PersonEmbed);
      return {
        id: row.id as string,
        name: person?.full_name ?? "—",
        kind: "expired" as const,
      };
    }),
    ...(soonAlertsRes.data ?? []).map((row) => {
      const person = firstEmbed(row.persons as PersonEmbed);
      return {
        id: row.id as string,
        name: person?.full_name ?? "—",
        kind: "expiring" as const,
      };
    }),
  ].slice(0, 6);

  const todayDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="animate-fade-in-up space-y-6 lg:space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {d.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {d.dashboard.subtitle}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            {d.dashboard.dateLabel}
          </p>
          <p className="text-sm font-medium capitalize text-[var(--color-text)]">
            {todayDate}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={d.dashboard.activeMembers}
          value={activeCount}
          hint={d.dashboard.activeMembersHint}
          accent="success"
          icon={<UserCheck className="h-4 w-4" aria-hidden />}
        />
        <MetricCard
          label={d.dashboard.checkInsToday}
          value={checkInsToday}
          hint={d.dashboard.checkInsTodayHint}
          accent="primary"
          icon={<LogIn className="h-4 w-4" aria-hidden />}
        />
        <MetricCard
          label={d.dashboard.expiringSoon}
          value={expiringCount}
          hint={d.dashboard.expiringSoonHint}
          accent="danger"
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
        />
      </div>

      <DashboardQuickActions
        locale={locale}
        canCheckIn={canInWorkspace(workspace, "checkin")}
        canManageMembers={canInWorkspace(workspace, "manage_members")}
        canManageStaff={canInWorkspace(workspace, "manage_staff")}
        plans={registerPlans}
        labels={{
          quickActions: d.dashboard.quickActions,
          quickCheckIn: d.dashboard.quickCheckIn,
          quickNewMember: d.dashboard.quickNewMember,
          quickNewTrainer: d.dashboard.quickNewTrainer,
          quickNewStaff: d.dashboard.quickNewStaff,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.dashboard.weeklyAttendance}
            </h2>
            <span className="rounded-full bg-[var(--color-surface-hover)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              {d.dashboard.last7Days}
            </span>
          </div>
          <WeeklyBars days={weeklyDays} />
        </section>

        <section className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
            <AlertTriangle
              className="h-4 w-4 text-[var(--color-danger)]"
              aria-hidden
            />
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.dashboard.alerts}
            </h2>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                {d.dashboard.noAlerts}
              </p>
            ) : (
              alerts.map((alert) => (
                <Link
                  key={`${alert.kind}-${alert.id}`}
                  href={`/${locale}/members/${alert.id}`}
                  className="rounded-lg border-l-4 border-l-[var(--color-danger)] bg-[var(--color-danger-bg)] px-3 py-2.5 transition-opacity hover:opacity-90"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-danger)]">
                    {alert.kind === "expired"
                      ? d.dashboard.alertExpired
                      : d.dashboard.alertExpiring}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--color-text)]">
                    {alert.name}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--color-danger)] underline-offset-2">
                    {d.dashboard.alertActionRequired}
                  </p>
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            <Link
              href={`/${locale}/members`}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80"
            >
              {d.dashboard.viewAllAlerts}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.dashboard.accessLog}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-success)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              {d.dashboard.realtime}
            </span>
          </div>
          <Link
            href={`/${locale}/checkin`}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            {d.dashboard.viewAll}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-5 py-3 font-semibold">{d.dashboard.colMember}</th>
                <th className="px-5 py-3 font-semibold">{d.dashboard.colTime}</th>
                <th className="px-5 py-3 font-semibold">{d.dashboard.colPlan}</th>
                <th className="px-5 py-3 font-semibold">{d.dashboard.colStatus}</th>
                <th className="px-5 py-3 text-right font-semibold">
                  {d.dashboard.colAction}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recentCheckIns.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-[var(--color-muted)]"
                  >
                    <Users className="mx-auto mb-2 h-5 w-5 opacity-50" aria-hidden />
                    {d.dashboard.noCheckIns}
                  </td>
                </tr>
              ) : (
                recentCheckIns.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--color-surface-hover)]/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">
                          {row.initials}
                        </span>
                        <span className="font-medium text-[var(--color-text)]">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-[var(--color-muted)]">
                      {row.time}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text)]">
                      {row.planName}
                    </td>
                    <td className="px-5 py-3">
                      {row.status === "active" ? (
                        <span className="inline-flex rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-success)]">
                          {d.members.active}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-[var(--color-danger)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-danger)]">
                          {d.members.expired}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.status === "expired" ? (
                        <Link
                          href={`/${locale}/members/${row.membershipId}`}
                          className="inline-flex rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)]"
                        >
                          {d.dashboard.renew}
                        </Link>
                      ) : (
                        <Link
                          href={`/${locale}/members/${row.membershipId}`}
                          className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
                        >
                          {d.members.view}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--color-border)] px-5 py-3 text-center">
          <Link
            href={`/${locale}/checkin`}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80"
          >
            {d.dashboard.viewFullHistory}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
