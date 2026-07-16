"use client";

import { useTransition } from "react";
import type { Locale } from "@/lib/i18n/config";
import { formatSessionTime } from "@/lib/classes/types";
import {
  bookSession,
  cancelBooking,
} from "@/app/[locale]/(member)/me/actions";
import { Button } from "@/components/ui/button";

export type MemberSessionCard = {
  id: string;
  className: string;
  startsAt: string;
  capacity: number | null;
  confirmedCount: number;
  waitlistCount: number;
  myStatus: string | null;
  myBookingId: string | null;
};

export type MemberBookingCard = {
  id: string;
  className: string;
  startsAt: string;
  status: string;
  upcoming: boolean;
};

type Labels = {
  upcoming: string;
  myBookings: string;
  history: string;
  book: string;
  joinWaitlist: string;
  cancel: string;
  seats: string;
  waitlist: string;
  emptySessions: string;
  emptyBookings: string;
  statusConfirmed: string;
  statusWaitlisted: string;
  statusCancelled: string;
  statusAttended: string;
  statusNoShow: string;
};

function statusLabel(labels: Labels, status: string) {
  switch (status) {
    case "confirmed":
      return labels.statusConfirmed;
    case "waitlisted":
      return labels.statusWaitlisted;
    case "cancelled":
      return labels.statusCancelled;
    case "attended":
      return labels.statusAttended;
    case "no_show":
      return labels.statusNoShow;
    default:
      return status;
  }
}

export function MemberClassesClient({
  locale,
  sessions,
  bookings,
  labels,
}: {
  locale: Locale;
  sessions: MemberSessionCard[];
  bookings: MemberBookingCard[];
  labels: Labels;
}) {
  const [pending, startTransition] = useTransition();
  const upcomingBookings = bookings.filter((b) => b.upcoming);
  const history = bookings.filter((b) => !b.upcoming);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.upcoming}
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {labels.emptySessions}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => {
              const full =
                s.capacity != null && s.confirmedCount >= s.capacity;
              const seats =
                s.capacity == null
                  ? "∞"
                  : `${s.confirmedCount}/${s.capacity}`;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text)]">
                      {s.className}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatSessionTime(s.startsAt, locale)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {labels.seats}: {seats}
                      {s.waitlistCount > 0
                        ? ` · ${labels.waitlist}: ${s.waitlistCount}`
                        : ""}
                    </p>
                    {s.myStatus ? (
                      <p className="mt-1 text-xs font-medium text-[var(--color-primary)]">
                        {statusLabel(labels, s.myStatus)}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    {s.myBookingId &&
                    (s.myStatus === "confirmed" ||
                      s.myStatus === "waitlisted") ? (
                      <form
                        action={(fd) => {
                          startTransition(async () => {
                            await cancelBooking(fd);
                          });
                        }}
                      >
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="hidden"
                          name="booking_id"
                          value={s.myBookingId}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          disabled={pending}
                          className="text-sm"
                        >
                          {labels.cancel}
                        </Button>
                      </form>
                    ) : !s.myStatus ? (
                      <form
                        action={(fd) => {
                          startTransition(async () => {
                            await bookSession(fd);
                          });
                        }}
                      >
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="session_id" value={s.id} />
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={pending}
                          className="text-sm shadow-sm"
                        >
                          {full ? labels.joinWaitlist : labels.book}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.myBookings}
        </h2>
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {labels.emptyBookings}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcomingBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-[var(--color-border)] px-4 py-3"
              >
                <p className="font-medium">{b.className}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {formatSessionTime(b.startsAt, locale)} ·{" "}
                  {statusLabel(labels, b.status)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.history}
          </h2>
          <ul className="flex flex-col gap-2">
            {history.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-[var(--color-border)]/60 px-4 py-3 opacity-80"
              >
                <p className="font-medium">{b.className}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {formatSessionTime(b.startsAt, locale)} ·{" "}
                  {statusLabel(labels, b.status)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
