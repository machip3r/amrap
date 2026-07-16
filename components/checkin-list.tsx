"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { CheckInListItem } from "@/lib/checkin/queries";

export type CheckInListLabels = {
  colMember: string;
  colTime: string;
  colPlan: string;
  colSource: string;
  noPlan: string;
  sourceQr: string;
  sourceManual: string;
  sourceKiosk: string;
  empty: string;
};

type Props = {
  locale: Locale;
  items: CheckInListItem[];
  labels: CheckInListLabels & { viewMemberProfile?: string };
  /** Base path for member calendar, e.g. `/en/checkin/history` */
  detailBaseHref: string;
  /** When set, show a link to the member profile page. */
  showMemberProfileLink?: boolean;
};

function sourceLabel(source: string, labels: CheckInListLabels) {
  const s = source.toUpperCase();
  if (s === "QR") return labels.sourceQr;
  if (s === "MANUAL") return labels.sourceManual;
  if (s === "KIOSK") return labels.sourceKiosk;
  return source;
}

function formatTime(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function CheckInList({
  locale,
  items,
  labels,
  detailBaseHref,
  showMemberProfileLink = false,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-[var(--color-muted)]">
        {labels.empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <th className="px-4 py-3 sm:px-5">{labels.colMember}</th>
            <th className="px-4 py-3">{labels.colTime}</th>
            <th className="px-4 py-3">{labels.colPlan}</th>
            <th className="px-4 py-3">{labels.colSource}</th>
            {showMemberProfileLink && labels.viewMemberProfile ? (
              <th className="px-4 py-3 pr-5 text-right">{labels.viewMemberProfile}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const calendarHref = `${detailBaseHref}/${row.membershipId}`;
            const memberHref = `/${locale}/members/${row.membershipId}`;
            return (
              <tr key={row.id} className="border-b border-[var(--color-border)]/70 last:border-b-0">
                <td className="px-4 py-3 sm:px-5">
                  <Link
                    href={calendarHref}
                    className="flex items-center gap-3 rounded-lg outline-none ring-[var(--color-ring)] transition-colors hover:opacity-90 focus-visible:ring-2"
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)]">
                      {initials(row.memberName)}
                    </span>
                    <span className="truncate font-semibold text-[var(--color-text)]">
                      {row.memberName}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-text)]">
                  <Link href={calendarHref} className="hover:underline">
                    {formatTime(row.checkedInAt, locale)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text)]">
                    {row.planName ?? labels.noPlan}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {sourceLabel(row.source, labels)}
                </td>
                {showMemberProfileLink && labels.viewMemberProfile ? (
                  <td className="px-4 py-3 pr-5 text-right">
                    <Link
                      href={memberHref}
                      className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      {labels.viewMemberProfile}
                    </Link>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
