import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, Phone, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadMemberCheckInsMonth } from "@/lib/checkin/queries";
import { CheckInMonthCalendar } from "@/components/checkin-month-calendar";
import { uuidSchema } from "@/lib/validation/schemas";

function parseMonthParam(raw: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: y, month: m };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export default async function MemberCheckInCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; membershipId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale: raw, membershipId } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const sp = await searchParams;

  const id = uuidSchema.safeParse(membershipId);
  if (!id.success) notFound();

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "checkin")) {
    return (
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
    );
  }

  const { year, month } = parseMonthParam(sp.month);
  const d = getDictionary(locale);
  const supabase = await createClient();
  const data = await loadMemberCheckInsMonth(
    supabase,
    workspace.gymId,
    id.data,
    year,
    month,
  );
  if (!data) notFound();

  const baseHref = `/${locale}/checkin/history/${id.data}`;
  const active =
    data.expiresAt != null && new Date(data.expiresAt).getTime() > Date.now();
  const canOpenMember = canInWorkspace(workspace, "manage_members");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <Link
        href={`/${locale}/checkin/history`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {d.checkin.backToHistory}
      </Link>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-base font-bold text-[var(--color-primary)]">
              {initials(data.memberName)}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {d.checkin.calendarTitle}
              </p>
              <h1 className="font-title truncate text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
                {data.memberName}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {d.checkin.calendarSubtitle}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    active
                      ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                      : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                  }`}
                >
                  {active ? d.checkin.active : d.checkin.expired}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text)]">
                  <CreditCard className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden />
                  {data.planName ?? d.checkin.noPlan}
                </span>
              </div>
            </div>
          </div>

          {canOpenMember ? (
            <Link
              href={`/${locale}/members/${data.membershipId}`}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] transition-[filter] hover:brightness-[0.92]"
            >
              {d.checkin.viewMemberProfile}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        <dl className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-5 sm:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-bg)] px-4 py-3">
            <dt className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {d.members.email}
            </dt>
            <dd className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
              {data.email ?? "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-[var(--color-bg)] px-4 py-3">
            <dt className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {d.members.phone}
            </dt>
            <dd className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
              {data.phone ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <CheckInMonthCalendar
        locale={locale}
        year={data.year}
        month={data.month}
        checkIns={data.checkIns}
        baseHref={baseHref}
        labels={{
          calendarPrev: d.checkin.calendarPrev,
          calendarNext: d.checkin.calendarNext,
          calendarToday: d.checkin.calendarToday,
          checkInsOnDay: d.checkin.checkInsOnDay,
          noCheckInsOnDay: d.checkin.noCheckInsOnDay,
          noCheckInsMonth: d.checkin.noCheckInsMonth,
          visitsThisMonth: d.checkin.visitsThisMonth,
          visitsLabel: d.checkin.visitsLabel,
          daysPresent: d.checkin.daysPresent,
          daysPresentHint: d.checkin.daysPresentHint,
          bySource: d.checkin.bySource,
          selectedDayTitle: d.checkin.selectedDayTitle,
          visitCount: d.checkin.visitCount,
          sourceQr: d.checkin.sourceQr,
          sourceManual: d.checkin.sourceManual,
          sourceKiosk: d.checkin.sourceKiosk,
        }}
      />
    </div>
  );
}
