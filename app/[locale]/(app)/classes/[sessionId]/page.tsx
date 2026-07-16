import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadSessionRoster } from "@/lib/classes/queries";
import { formatSessionTime } from "@/lib/classes/types";
import {
  cancelBookingStaff,
  cancelClassSession,
  setBookingStatusStaff,
  bookClassForMember,
} from "@/app/[locale]/(app)/classes/actions";
import { Button } from "@/components/ui/button";
import { ClassSessionBookForm } from "@/components/class-session-book-form";
import {
  RosterCareBadges,
  RosterResultButton,
} from "@/components/roster/roster-care-actions";

export default async function ClassSessionPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale: raw, sessionId } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (
    !canInWorkspace(workspace, "manage_classes") &&
    !canInWorkspace(workspace, "checkin")
  ) {
    return (
      <p className="text-[var(--color-muted)]">{d.common.forbidden}</p>
    );
  }

  const supabase = await createClient();
  const roster = await loadSessionRoster(supabase, sessionId);
  if (!roster || roster.session.gym_id !== workspace.gymId) notFound();

  const { session, bookings } = roster;
  const confirmed = bookings.filter((b) =>
    ["confirmed", "attended", "no_show"].includes(b.status),
  );
  const waitlisted = bookings.filter((b) => b.status === "waitlisted");
  const canManage = canInWorkspace(workspace, "manage_classes");
  const canCheckin =
    canInWorkspace(workspace, "checkin") || canManage;

  const rosterLabels = { ...d.roster, close: d.registerUser.close };

  const { data: members } = await supabase
    .from("memberships")
    .select("person_id, persons ( id, full_name )")
    .eq("gym_id", workspace.gymId)
    .eq("status", "ACTIVE")
    .gte("expires_at", new Date().toISOString())
    .limit(200);

  const memberOptions = (members ?? [])
    .map((m) => {
      const p = Array.isArray(m.persons) ? m.persons[0] : m.persons;
      return {
        personId: m.person_id as string,
        name: (p as { full_name?: string } | null)?.full_name ?? "",
      };
    })
    .filter((m) => m.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href={`/${locale}/classes?tab=calendar`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {d.classes.tabCalendar}
        </Link>
        <h1 className="mt-3 font-title text-3xl font-bold text-[var(--color-text)]">
          {session.class_name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {formatSessionTime(session.starts_at, locale)}
          {session.status === "cancelled" ? ` · ${d.classes.cancelled}` : ""}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.classes.seats}:{" "}
          {session.capacity == null
            ? d.classes.unlimited
            : `${confirmed.length}/${session.capacity}`}
          {waitlisted.length > 0
            ? ` · ${d.classes.waitlist}: ${waitlisted.length}`
            : ""}
        </p>
      </div>

      {canManage && session.status === "scheduled" ? (
        <form action={cancelClassSession}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="session_id" value={session.id} />
          <Button type="submit" variant="ghost" className="text-sm">
            {d.classes.cancelSession}
          </Button>
        </form>
      ) : null}

      {canCheckin && session.status === "scheduled" ? (
        <ClassSessionBookForm
          locale={locale}
          sessionId={session.id}
          members={memberOptions}
          bookedPersonIds={bookings.map((b) => b.person_id)}
          labels={{
            bookMember: d.classes.bookMember,
            selectMember: d.classes.selectMember,
            book: d.classes.book,
          }}
          action={bookClassForMember}
        />
      ) : null}

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {d.classes.roster}
        </h2>
        {confirmed.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{d.classes.rosterEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {confirmed.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-medium text-[var(--color-text)]">
                      {b.person_name}
                    </p>
                    <RosterCareBadges
                      medicalNote={b.medical_note}
                      isFirstDay={b.isFirstDay}
                      isBirthday={b.isBirthday}
                      labels={rosterLabels}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">{b.status}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {canManage ? (
                    <RosterResultButton
                      locale={locale}
                      sessionId={session.id}
                      personId={b.person_id}
                      personName={b.person_name}
                      existing={b.result}
                      labels={rosterLabels}
                    />
                  ) : null}
                  {canCheckin && b.status === "confirmed" ? (
                    <>
                      <form action={setBookingStatusStaff}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="booking_id" value={b.id} />
                        <input type="hidden" name="session_id" value={session.id} />
                        <input type="hidden" name="status" value="attended" />
                        <button
                          type="submit"
                          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
                        >
                          {d.classes.markAttended}
                        </button>
                      </form>
                      <form action={setBookingStatusStaff}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="booking_id" value={b.id} />
                        <input type="hidden" name="session_id" value={session.id} />
                        <input type="hidden" name="status" value="no_show" />
                        <button
                          type="submit"
                          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
                        >
                          {d.classes.markNoShow}
                        </button>
                      </form>
                    </>
                  ) : null}
                  {b.status !== "attended" && b.status !== "no_show" ? (
                    <form action={cancelBookingStaff}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="booking_id" value={b.id} />
                      <input type="hidden" name="session_id" value={session.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted)]"
                      >
                        {d.classes.cancelBooking}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {d.classes.waitlist}
        </h2>
        {waitlisted.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {d.classes.waitlistEmpty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {waitlisted.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-medium">
                    #{b.waitlist_position ?? "—"} {b.person_name}
                  </p>
                  <RosterCareBadges
                    medicalNote={b.medical_note}
                    isFirstDay={b.isFirstDay}
                    isBirthday={b.isBirthday}
                    labels={rosterLabels}
                  />
                </div>
                <form action={cancelBookingStaff}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="booking_id" value={b.id} />
                  <input type="hidden" name="session_id" value={session.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
                  >
                    {d.classes.cancelBooking}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
