"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { PaymentKind } from "@/types";
import type { PageMeta } from "@/lib/pagination";
import { useListQueryParams } from "@/lib/list-query-params";
import { Input } from "@/components/ui/input";
import {
  TablePagination,
  type TablePaginationLabels,
} from "@/components/ui/table-pagination";
import { LIMITS } from "@/lib/validation/schemas";

export type PaymentListItem = {
  id: string;
  memberName: string;
  amount: number;
  methodLabel: string;
  createdAt: string;
  kind: PaymentKind;
  kindLabel: string;
  planName: string | null;
};

export type PaymentsListLabels = {
  date: string;
  member: string;
  amount: string;
  method: string;
  concept: string;
  noPayments: string;
  noResults: string;
  searchPlaceholder: string;
  reload: string;
  showing: string;
  newBadge: string;
  previous: string;
  next: string;
};

type Props = {
  locale: Locale;
  payments: PaymentListItem[];
  labels: PaymentsListLabels;
  meta: PageMeta;
  q: string;
  highlightId?: string | null;
};

function formatAmount(amount: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

function formatDate(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PaymentsListClient({
  locale,
  payments,
  labels,
  meta,
  q: initialQ,
  highlightId = null,
}: Props) {
  const { pending, pushParams, reload, pathname } = useListQueryParams();
  const [query, setQuery] = useState(initialQ);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (!highlightId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`payment-row-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(scrollTimer);
  }, [highlightId]);

  const emptyMessage =
    meta.total === 0 && !initialQ ? labels.noPayments : labels.noResults;

  const paginationLabels: TablePaginationLabels = {
    showing: labels.showing,
    previous: labels.previous,
    next: labels.next,
  };

  const searchParams = {
    q: initialQ || undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              aria-hidden
            />
            <Input
              type="search"
              variant="search"
              className="pl-10"
              maxLength={LIMITS.search}
              placeholder={labels.searchPlaceholder}
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                pushParams(
                  searchParams,
                  { q: value.trim() || null },
                  { debounce: true },
                );
              }}
              aria-label={labels.searchPlaceholder}
            />
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={pending}
            className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
            aria-label={labels.reload}
            title={labels.reload}
          >
            <RefreshCw
              className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-4 py-3 sm:px-5">{labels.date}</th>
                <th className="px-4 py-3">{labels.member}</th>
                <th className="px-4 py-3">{labels.concept}</th>
                <th className="px-4 py-3">{labels.amount}</th>
                <th className="px-4 py-3 pr-5">{labels.method}</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-[var(--color-muted)]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isNew = highlightId === p.id;
                  return (
                    <tr
                      key={p.id}
                      id={`payment-row-${p.id}`}
                      className={`border-b border-[var(--color-border)]/70 transition-colors last:border-b-0 hover:bg-[var(--color-surface-hover)]/40 ${
                        isNew ? "amrap-row-shine" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 tabular-nums text-[var(--color-text)] sm:px-5">
                        {formatDate(p.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[var(--color-text)]">
                        {p.memberName}
                        {isNew ? (
                          <span className="ml-2 text-[11px] font-medium text-[var(--color-primary)]">
                            {labels.newBadge}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex max-w-full flex-col gap-0.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            p.kind === "day_pass"
                              ? "bg-[var(--color-muted)]/15 text-[var(--color-text)]"
                              : "bg-[var(--color-primary-soft)] text-[var(--color-text)]"
                          }`}
                        >
                          <span className="truncate">{p.kindLabel}</span>
                          {p.planName ? (
                            <span className="truncate font-medium text-[var(--color-muted)]">
                              {p.planName}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums font-semibold text-[var(--color-text)]">
                        {formatAmount(p.amount, locale)}
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <span className="inline-flex rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text)]">
                          {p.methodLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          meta={meta}
          href={pathname}
          searchParams={searchParams}
          labels={paginationLabels}
        />
      </div>
    </div>
  );
}
