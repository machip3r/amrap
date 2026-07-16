"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Banknote, CalendarDays, Ticket, Wallet } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import {
  RegisterPaymentButton,
  type PaymentMemberOption,
  type PaymentPlanOption,
} from "@/components/register-payment-dialog";
import {
  PaymentsListClient,
  type PaymentListItem,
  type PaymentsListLabels,
} from "@/components/payments-list-client";
import type { PageMeta } from "@/lib/pagination";

export type PaymentsPageStats = {
  monthTotal: number;
  monthHint: string;
  todayTotal: number;
  todayHint: string;
  plansTotal: number;
  plansHint: string;
  dayPassTotal: number;
  dayPassHint: string;
};

type StatLabels = {
  statMonth: string;
  statToday: string;
  statPlans: string;
  statDayPass: string;
};

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  members: PaymentMemberOption[];
  plans: PaymentPlanOption[];
  dayPassPrice: number | null;
  payments: PaymentListItem[];
  stats: PaymentsPageStats;
  labels: PaymentsListLabels & StatLabels;
  noMembersHint: string;
  meta: PageMeta;
  q: string;
};

function formatAmount(amount: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function EarningsCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent: "primary" | "success" | "muted";
}) {
  const accentBar =
    accent === "primary"
      ? "bg-[var(--color-primary)]"
      : accent === "success"
        ? "bg-[var(--color-success)]"
        : "bg-[var(--color-muted)]";
  const iconWrap =
    accent === "primary"
      ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
      : accent === "success"
        ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
        : "bg-[var(--color-muted)]/15 text-[var(--color-muted)]";

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
      <p className="font-title mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs font-medium text-[var(--color-muted)]">{hint}</p>
    </div>
  );
}

export function PaymentsPageClient({
  locale,
  title,
  subtitle,
  members,
  plans,
  dayPassPrice,
  payments,
  stats,
  labels,
  noMembersHint,
  meta,
  q,
}: Props) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    };
  }, []);

  function flashRow(id: string) {
    if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    setHighlightId(id);
    clearTimer.current = window.setTimeout(() => {
      setHighlightId(null);
      clearTimer.current = null;
    }, 3000);
  }

  const {
    statMonth,
    statToday,
    statPlans,
    statDayPass,
    ...listLabels
  } = labels;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
          {members.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">{noMembersHint}</p>
          ) : null}
        </div>
        <RegisterPaymentButton
          locale={locale}
          members={members}
          plans={plans}
          dayPassPrice={dayPassPrice}
          onSuccess={flashRow}
        />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EarningsCard
          label={statMonth}
          value={formatAmount(stats.monthTotal, locale)}
          hint={stats.monthHint}
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          accent="primary"
        />
        <EarningsCard
          label={statToday}
          value={formatAmount(stats.todayTotal, locale)}
          hint={stats.todayHint}
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          accent="success"
        />
        <EarningsCard
          label={statPlans}
          value={formatAmount(stats.plansTotal, locale)}
          hint={stats.plansHint}
          icon={<Banknote className="h-4 w-4" aria-hidden />}
          accent="muted"
        />
        <EarningsCard
          label={statDayPass}
          value={formatAmount(stats.dayPassTotal, locale)}
          hint={stats.dayPassHint}
          icon={<Ticket className="h-4 w-4" aria-hidden />}
          accent="muted"
        />
      </div>

      <PaymentsListClient
        locale={locale}
        payments={payments}
        labels={listLabels}
        meta={meta}
        q={q}
        highlightId={highlightId}
      />
    </div>
  );
}
