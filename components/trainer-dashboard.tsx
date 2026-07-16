import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Layers,
  Timer,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadSessionsForWeek } from "@/lib/classes/queries";
import {
  formatSessionTime,
  startOfWeekMonday,
  type ClassSessionRow,
} from "@/lib/classes/types";

type Props = {
  locale: Locale;
  gymId: string;
  userId: string;
  fullName: string | null;
  labels: Dictionary["dashboard"];
};

function pickHero(
  sessions: ClassSessionRow[],
  nowIso: string,
  todayKey: string,
): ClassSessionRow | null {
  const active = sessions.find(
    (s) =>
      s.status !== "cancelled" &&
      s.starts_at <= nowIso &&
      s.ends_at > nowIso,
  );
  if (active) return active;

  const upcomingToday = sessions
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        s.starts_at > nowIso &&
        s.starts_at.slice(0, 10) === todayKey,
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  if (upcomingToday[0]) return upcomingToday[0];

  const upcomingWeek = sessions
    .filter((s) => s.status !== "cancelled" && s.starts_at > nowIso)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return upcomingWeek[0] ?? null;
}

function MetricPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </p>
        <p className="font-title text-2xl font-bold tabular-nums text-[var(--color-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}

export async function TrainerDashboard({
  locale,
  gymId,
  userId,
  fullName,
  labels,
}: Props) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeekMonday(now);
  const nowIso = now.toISOString();
  const todayKey = nowIso.slice(0, 10);

  const [{ data: classLinks }, sessions] = await Promise.all([
    supabase
      .from("class_trainers")
      .select("class_id, classes!inner ( id, name, is_active, gym_id )")
      .eq("user_id", userId),
    loadSessionsForWeek(supabase, gymId, weekStart, {
      trainerUserId: userId,
    }),
  ]);

  const myClasses = (classLinks ?? []).filter((row) => {
    const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    const c = cls as { gym_id?: string; is_active?: boolean } | null;
    return c?.gym_id === gymId && c?.is_active !== false;
  });

  const hero = pickHero(sessions, nowIso, todayKey);
  const heroLive =
    Boolean(hero) &&
    hero!.starts_at <= nowIso &&
    hero!.ends_at > nowIso;

  const upcoming = sessions
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        s.starts_at >= nowIso &&
        (!hero || s.id !== hero.id),
    )
    .slice(0, 6);

  const sessionsThisWeek = sessions.filter(
    (s) => s.status !== "cancelled",
  ).length;

  const bookedThisWeek = sessions.reduce(
    (sum, s) => sum + (s.confirmed_count ?? 0),
    0,
  );

  const todayDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const coachLabel = fullName?.trim() || "—";

  return (
    <div className="animate-fade-in-up space-y-6 lg:space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {labels.titleTrainer}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {labels.subtitleTrainer}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            {labels.dateLabel}
          </p>
          <p className="text-sm font-medium capitalize text-[var(--color-text)]">
            {todayDate}
          </p>
        </div>
      </div>

      {hero ? (
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-primary)]/8 px-5 py-3 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
              {heroLive ? labels.heroLive : labels.heroNext}
            </p>
          </div>
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="min-w-0">
              <h2 className="font-title text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
                {hero.class_name || "—"}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {formatSessionTime(hero.starts_at, locale)}
                {" · "}
                {coachLabel}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-hover)] px-3 py-1 text-sm font-semibold tabular-nums text-[var(--color-text)]">
                <Users className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                {hero.confirmed_count ?? 0}/{hero.capacity ?? "∞"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/classes/${hero.id}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                {labels.openRoster}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={`/${locale}/timers`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <Timer className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                {labels.openTimers}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 text-center shadow-sm">
          <p className="text-sm text-[var(--color-muted)]">{labels.heroEmpty}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href={`/${locale}/classes?tab=catalog`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            >
              <Layers className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              {labels.quickNewClass}
            </Link>
            <Link
              href={`/${locale}/timers`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3.5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            >
              <Timer className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              {labels.openTimers}
            </Link>
          </div>
        </section>
      )}

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          {labels.weekStrip}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <MetricPill
            label={labels.myClasses}
            value={myClasses.length}
            icon={<Layers className="h-4 w-4" aria-hidden />}
          />
          <MetricPill
            label={labels.sessionsThisWeek}
            value={sessionsThisWeek}
            icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          />
          <MetricPill
            label={labels.bookedThisWeek}
            value={bookedThisWeek}
            icon={<Users className="h-4 w-4" aria-hidden />}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
            {labels.upcomingSessions}
          </h2>
          <Link
            href={`/${locale}/classes?tab=calendar`}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
          >
            {labels.viewAll}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-muted)]">
            {labels.noUpcomingSessions}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {upcoming.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${locale}/classes/${s.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-hover)]/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--color-text)]">
                      {s.class_name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {formatSessionTime(s.starts_at, locale)}
                      {" · "}
                      {s.confirmed_count}/{s.capacity ?? "∞"}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-[var(--color-primary)]"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
