"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  QrCode,
  Keyboard,
  MonitorSmartphone,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { MemberMonthCheckIn } from "@/lib/checkin/queries";

export type CheckInCalendarLabels = {
  calendarPrev: string;
  calendarNext: string;
  calendarToday: string;
  checkInsOnDay: string;
  noCheckInsOnDay: string;
  noCheckInsMonth: string;
  visitsThisMonth: string;
  visitsLabel: string;
  daysPresent: string;
  daysPresentHint: string;
  bySource: string;
  selectedDayTitle: string;
  visitCount: string;
  sourceQr: string;
  sourceManual: string;
  sourceKiosk: string;
};

type Props = {
  locale: Locale;
  year: number;
  month: number;
  checkIns: MemberMonthCheckIn[];
  labels: CheckInCalendarLabels;
  /** e.g. `/en/checkin/history/uuid` */
  baseHref: string;
};

function sourceMeta(
  source: string,
  labels: CheckInCalendarLabels,
): { label: string; Icon: typeof QrCode } {
  const s = source.toUpperCase();
  if (s === "QR") return { label: labels.sourceQr, Icon: QrCode };
  if (s === "MANUAL") return { label: labels.sourceManual, Icon: Keyboard };
  if (s === "KIOSK") return { label: labels.sourceKiosk, Icon: MonitorSmartphone };
  return { label: source, Icon: Clock3 };
}

function padMonth(n: number) {
  return String(n).padStart(2, "0");
}

function monthHref(baseHref: string, year: number, month: number) {
  return `${baseHref}?month=${year}-${padMonth(month)}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function CheckInMonthCalendar({
  locale,
  year,
  month,
  checkIns,
  labels,
  baseHref,
}: Props) {
  const byDay = useMemo(() => {
    const map = new Map<number, MemberMonthCheckIn[]>();
    for (const c of checkIns) {
      const day = new Date(c.checkedInAt).getDate();
      const list = map.get(day) ?? [];
      list.push(c);
      map.set(day, list);
    }
    return map;
  }, [checkIns]);

  const sourceCounts = useMemo(() => {
    let qr = 0;
    let manual = 0;
    let kiosk = 0;
    let other = 0;
    for (const c of checkIns) {
      const s = c.source.toUpperCase();
      if (s === "QR") qr += 1;
      else if (s === "MANUAL") manual += 1;
      else if (s === "KIOSK") kiosk += 1;
      else other += 1;
    }
    return { qr, manual, kiosk, other };
  }, [checkIns]);

  const daysPresent = byDay.size;

  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      return today.getDate();
    }
    const first = [...byDay.keys()].sort((a, b) => a - b)[0];
    return first ?? null;
  });

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;

  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: "short" });
    });
  }, [locale]);

  const monthTitle = new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  const selectedList =
    selectedDay != null ? (byDay.get(selectedDay) ?? []) : [];

  const selectedDateLabel =
    selectedDay != null
      ? new Date(year, month - 1, selectedDay).toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "";

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const sourceRows = [
    { key: "qr", count: sourceCounts.qr, ...sourceMeta("QR", labels) },
    {
      key: "manual",
      count: sourceCounts.manual,
      ...sourceMeta("MANUAL", labels),
    },
    {
      key: "kiosk",
      count: sourceCounts.kiosk,
      ...sourceMeta("KIOSK", labels),
    },
  ].filter((r) => r.count > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.visitsLabel}
          </p>
          <p className="font-title mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">
            {checkIns.length}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {labels.visitsThisMonth.replace("{count}", String(checkIns.length))}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.daysPresentHint}
          </p>
          <p className="font-title mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">
            {daysPresent}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {labels.daysPresent.replace("{count}", String(daysPresent))}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.bySource}
          </p>
          {sourceRows.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">—</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {sourceRows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text)]">
                    <row.Icon className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden />
                    {row.label}
                  </span>
                  <span className="tabular-nums font-semibold text-[var(--color-text)]">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={monthHref(baseHref, prev.year, prev.month)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                aria-label={labels.calendarPrev}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Link>
              <h2 className="min-w-[9rem] text-center font-title text-base font-bold capitalize text-[var(--color-text)] sm:text-lg">
                {monthTitle}
              </h2>
              <Link
                href={monthHref(baseHref, next.year, next.month)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                aria-label={labels.calendarNext}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {!isCurrentMonth ? (
              <Link
                href={monthHref(baseHref, now.getFullYear(), now.getMonth() + 1)}
                className="text-sm font-semibold text-[var(--color-primary)]"
              >
                {labels.calendarToday}
              </Link>
            ) : null}
          </div>

          <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/40">
            {weekdayLabels.map((w) => (
              <div
                key={w}
                className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] sm:text-[11px]"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day == null) {
                return (
                  <div
                    key={`e-${i}`}
                    className="min-h-[3.5rem] border-b border-r border-[var(--color-border)]/50 bg-[var(--color-bg)]/40"
                  />
                );
              }
              const count = byDay.get(day)?.length ?? 0;
              const selected = selectedDay === day;
              const isToday = isCurrentMonth && now.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative min-h-[3.5rem] border-b border-r border-[var(--color-border)]/50 p-1.5 text-left transition-colors ${
                    selected
                      ? "bg-[var(--color-primary)]/12"
                      : "hover:bg-[var(--color-surface-hover)]/60"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                        : count > 0
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-muted)]"
                    }`}
                  >
                    {day}
                  </span>
                  {count > 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
                      <span className="flex gap-0.5">
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <span
                            key={j}
                            className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"
                          />
                        ))}
                      </span>
                      {count > 3 ? (
                        <span className="text-[10px] font-semibold tabular-nums text-[var(--color-primary)]">
                          +{count - 3}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              {labels.selectedDayTitle}
            </p>
            <h3 className="mt-1 font-title text-lg font-bold capitalize text-[var(--color-text)]">
              {selectedDateLabel || "—"}
            </h3>
            {selectedDay != null ? (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {labels.visitCount.replace(
                  "{count}",
                  String(selectedList.length),
                )}
              </p>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col p-4">
            {checkIns.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                {labels.noCheckInsMonth}
              </p>
            ) : selectedDay == null || selectedList.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                {labels.noCheckInsOnDay}
              </p>
            ) : (
              <ol className="relative flex flex-col gap-0 border-l border-[var(--color-border)] pl-4">
                {selectedList.map((c, index) => {
                  const { label, Icon } = sourceMeta(c.source, labels);
                  return (
                    <li key={c.id} className="relative pb-4 last:pb-0">
                      <span className="absolute -left-[1.28rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary)]" />
                      <div className="rounded-xl bg-[var(--color-bg)] px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-[var(--color-text)]">
                            <Clock3
                              className="h-3.5 w-3.5 text-[var(--color-muted)]"
                              aria-hidden
                            />
                            {new Date(c.checkedInAt).toLocaleTimeString(locale, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <span className="text-[11px] font-medium text-[var(--color-muted)]">
                            #{index + 1}
                          </span>
                        </div>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                          {label}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
