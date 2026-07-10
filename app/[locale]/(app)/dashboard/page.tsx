import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Users, UserCheck, AlertTriangle, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);

  const d = getDictionary(locale);
  const supabase = await createClient();
  const tid = profile.tenant_id;
  const now = new Date().toISOString();

  const { count: total } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid);

  const { count: active } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .gte("membership_expires_at", now);

  const { count: expired } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .lt("membership_expires_at", now);

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count: paymentsToday } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tid)
    .gte("created_at", start.toISOString());

  const todayDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Placeholder capacity until live occupancy exists
  const maxCapacity = 120;
  const present = 0;
  const occupancyPct = 0;

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-title text-3xl font-bold text-[var(--color-text)]">
            {d.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{d.dashboard.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            {d.dashboard.dateLabel}
          </p>
          <p className="text-sm font-medium text-[var(--color-text)]">{todayDate}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel flex flex-col justify-between rounded-lg p-5">
          <div className="flex items-center justify-between text-[var(--color-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {d.dashboard.totalMembers}
            </span>
            <Users className="h-4 w-4" aria-hidden />
          </div>
          <div className="font-title mt-4 text-4xl font-bold">{total ?? 0}</div>
        </div>

        <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-lg p-5">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[var(--color-success-bg)] to-transparent" />
          <div className="relative z-10 flex items-center justify-between text-[var(--color-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {d.dashboard.activeMembers}
            </span>
            <UserCheck className="h-4 w-4 text-[var(--color-success)]" aria-hidden />
          </div>
          <div className="font-title relative z-10 mt-4 text-4xl font-bold text-[var(--color-success)]">
            {active ?? 0}
          </div>
        </div>

        <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-lg border-b-2 border-b-[var(--color-primary)] p-5">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[var(--color-danger-bg)] to-transparent" />
          <div className="relative z-10 flex items-center justify-between text-[var(--color-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {d.dashboard.expiredMembers}
            </span>
            <AlertTriangle className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          </div>
          <div className="font-title relative z-10 mt-4 text-4xl font-bold text-[var(--color-primary)]">
            {expired ?? 0}
          </div>
        </div>

        <div className="glass-panel flex flex-col justify-between rounded-lg p-5">
          <div className="flex items-center justify-between text-[var(--color-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              {d.dashboard.paymentsToday}
            </span>
            <CreditCard className="h-4 w-4" aria-hidden />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <div className="font-title text-4xl font-bold">{paymentsToday ?? 0}</div>
            <div className="text-sm text-[var(--color-muted)]">{d.dashboard.renewals}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel flex flex-col rounded-lg lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.dashboard.accessLog}
            </h2>
            <Link
              href={`/${locale}/checkin`}
              className="flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {d.dashboard.viewAll} <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>

          <div className="flex-1 p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="p-4 font-medium">{d.dashboard.colMember}</th>
                  <th className="p-4 font-medium">{d.dashboard.colTime}</th>
                  <th className="p-4 font-medium">{d.dashboard.colMembershipStatus}</th>
                  <th className="p-4 text-right font-medium">{d.dashboard.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--color-muted)]">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel flex flex-col rounded-lg">
          <div className="border-b border-[var(--color-border)] p-5">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.dashboard.capacityTitle}
            </h2>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="relative mb-6 flex h-48 w-48 items-center justify-center rounded-lg border-4 border-b-[var(--color-primary)] border-l-transparent border-r-[var(--color-primary)] border-t-[var(--color-primary)] bg-[var(--color-surface-hover)] shadow-inner">
              <div className="text-center">
                <div className="font-title text-5xl font-bold text-[var(--color-text)]">
                  {occupancyPct}%
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
                  {d.dashboard.occupancy}
                </div>
              </div>
            </div>

            <div className="w-full space-y-3 rounded-md border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-text)]">
                  {d.dashboard.maxCapacity}
                </span>
                <span className="font-bold text-[var(--color-text)]">
                  {maxCapacity} {d.dashboard.people}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-text)]">
                  {d.dashboard.present}
                </span>
                <span className="font-bold text-[var(--color-primary)]">
                  {present} {d.dashboard.people}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
