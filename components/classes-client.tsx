"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { LIMITS } from "@/lib/validation/schemas";
import {
  addDays,
  startOfWeekMonday,
  type ClassSessionRow,
} from "@/lib/classes/types";
import {
  createClass,
  updateClass,
  setClassActive,
  createClassSchedule,
  duplicateClassToGym,
  type ClassFormState,
  type ScheduleFormState,
} from "@/app/[locale]/(app)/classes/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { WeekdayToggleGroup } from "@/components/weekday-toggle-group";
import { ClassesLoadingSplash } from "@/components/classes-loading";

type ClassesView = "catalog" | "calendar";
type ClassesLabels = Dictionary["classes"];

export type ClassesPageClass = {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  duration_minutes: number;
  tags: string[];
  is_active: boolean;
  trainerIds: string[];
  trainerNames: string[];
};

export type ClassesTrainerOption = {
  userId: string;
  name: string;
};

export type OrgGymOption = {
  id: string;
  name: string;
};

type Props = {
  locale: Locale;
  classes: ClassesPageClass[];
  trainers: ClassesTrainerOption[];
  sessions: ClassSessionRow[];
  weekStartIso: string;
  orgGyms: OrgGymOption[];
  currentGymId: string;
  canManage: boolean;
  /** When set, create form pre-selects these trainers. */
  defaultTrainerIds?: string[];
  /** Trainers creating classes: lock assignment to themselves. */
  lockTrainersToSelf?: boolean;
  currentUserId?: string;
  initialView: ClassesView;
  labels: ClassesLabels;
};

function trainerCountLabel(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function RestoreClassButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <ArchiveRestore className="h-4 w-4" aria-hidden />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}

function ClassFormFields({
  locale,
  state,
  pending,
  submitLabel,
  cancelLabel,
  onCancel,
  trainers,
  labels,
  mode,
  defaults,
  lockTrainersToSelf = false,
  lockedTrainerId,
}: {
  locale: Locale;
  state: ClassFormState;
  pending: boolean;
  submitLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  trainers: ClassesTrainerOption[];
  labels: ClassesLabels;
  mode: "create" | "edit";
  defaults?: {
    name: string;
    description: string | null;
    capacity: number | null;
    duration_minutes: number;
    tags: string[];
    trainerIds: string[];
  };
  lockTrainersToSelf?: boolean;
  lockedTrainerId?: string;
}) {
  const d = getDictionary(locale);
  const fe = state?.fieldErrors;
  const selected = new Set(defaults?.trainerIds ?? []);
  const [withSchedule, setWithSchedule] = useState(false);
  const [scheduleRecurrence, setScheduleRecurrence] = useState<"none" | "weekly">(
    "weekly",
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const selfTrainer = lockedTrainerId
    ? trainers.find((t) => t.userId === lockedTrainerId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <FormField label={labels.className} variant="auth" error={fe?.name}>
        <Input
          required
          name="name"
          variant="auth"
          maxLength={LIMITS.entityName}
          defaultValue={defaults?.name}
          autoComplete="off"
        />
      </FormField>
      <FormField
        label={labels.description}
        variant="auth"
        hint={labels.descriptionHint}
        error={fe?.description}
      >
        <Input
          name="description"
          variant="auth"
          maxLength={LIMITS.message}
          defaultValue={defaults?.description ?? ""}
        />
      </FormField>
      <FormField
        label={labels.capacity}
        variant="auth"
        hint={labels.capacityHint}
        error={fe?.capacity}
      >
        <Input
          name="capacity"
          type="number"
          min={1}
          max={10_000}
          step={1}
          inputMode="numeric"
          variant="auth"
          placeholder={labels.unlimited}
          defaultValue={defaults?.capacity ?? ""}
        />
      </FormField>
      <div>
        <p className="mb-1.5 text-sm font-medium text-[var(--color-text)]">
          {labels.trainers}
        </p>
        <p className="mb-2 text-xs text-[var(--color-muted)]">
          {lockTrainersToSelf
            ? labels.trainersSelfHint
            : labels.trainersHint}
        </p>
        {lockTrainersToSelf && lockedTrainerId ? (
          <>
            <input type="hidden" name="trainer_ids" value={lockedTrainerId} />
            <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)]">
              {selfTrainer?.name ?? labels.youAreTrainer}
            </p>
          </>
        ) : trainers.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{labels.noTrainers}</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2">
            {trainers.map((t) => (
              <li key={t.userId}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]">
                  <input
                    type="checkbox"
                    name="trainer_ids"
                    value={t.userId}
                    defaultChecked={selected.has(t.userId)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
                  />
                  <span className="truncate">{t.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {fe?.trainer_ids ? (
          <p
            className="mt-1.5 text-sm font-medium text-[var(--color-primary)]"
            role="alert"
          >
            {fe.trainer_ids}
          </p>
        ) : null}
      </div>

      <details className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] open:bg-[var(--color-surface)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text)] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block">{labels.advancedSettings}</span>
            <span className="mt-0.5 block text-xs font-normal text-[var(--color-muted)]">
              {labels.advancedHint}
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-90"
            aria-hidden
          />
        </summary>
        <div className="flex flex-col gap-4 border-t border-[var(--color-border)] px-3 py-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={labels.duration}
              variant="auth"
              hint={labels.durationHint}
              error={fe?.duration_minutes}
            >
              <Input
                name="duration_minutes"
                type="number"
                min={1}
                max={1440}
                step={1}
                inputMode="numeric"
                variant="auth"
                defaultValue={defaults?.duration_minutes ?? 60}
              />
            </FormField>
            <FormField
              label={labels.tags}
              variant="auth"
              hint={labels.tagsHint}
              error={fe?.tags}
            >
              <Input
                name="tags"
                variant="auth"
                defaultValue={(defaults?.tags ?? []).join(", ")}
                placeholder="yoga, hiit"
              />
            </FormField>
          </div>

          {mode === "create" ? (
            <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)]/80 p-3">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  name="with_schedule"
                  checked={withSchedule}
                  onChange={(e) => setWithSchedule(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
                />
                <span>
                  <span className="font-medium">{labels.addScheduleNow}</span>
                  <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                    {labels.scheduleHint}
                  </span>
                </span>
              </label>

              {withSchedule ? (
                <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
                  <input
                    type="hidden"
                    name="timezone"
                    value="America/Mexico_City"
                  />
                  <FormField label={labels.recurrence} variant="auth">
                    <select
                      name="recurrence"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
                      value={scheduleRecurrence}
                      onChange={(e) =>
                        setScheduleRecurrence(
                          e.target.value as "none" | "weekly",
                        )
                      }
                    >
                      <option value="weekly">{labels.recurrenceWeekly}</option>
                      <option value="none">{labels.recurrenceNone}</option>
                    </select>
                  </FormField>
                  {scheduleRecurrence === "weekly" ? (
                    <WeekdayToggleGroup
                      legend={labels.days}
                      labels={[
                        labels.dayMon,
                        labels.dayTue,
                        labels.dayWed,
                        labels.dayThu,
                        labels.dayFri,
                        labels.daySat,
                        labels.daySun,
                      ]}
                      error={fe?.days_of_week}
                    />
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label={labels.time} variant="auth" error={fe?.local_time}>
                      <Input
                        name="local_time"
                        type="time"
                        required={withSchedule}
                        variant="auth"
                        defaultValue="07:00"
                      />
                    </FormField>
                    <FormField
                      label={labels.validFrom}
                      variant="auth"
                      error={fe?.valid_from}
                    >
                      <Input
                        name="valid_from"
                        type="date"
                        required={withSchedule}
                        variant="auth"
                        defaultValue={todayStr}
                      />
                    </FormField>
                  </div>
                  <FormField label={labels.validUntil} variant="auth">
                    <Input name="valid_until" type="date" variant="auth" />
                  </FormField>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </details>

      {state?.error ? (
        <p
          className="text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold"
          onClick={onCancel}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="mt-0 inline-flex items-center justify-center gap-2 shadow-sm"
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {pending ? d.classes.saving : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function ClassesClient({
  locale,
  classes,
  trainers,
  sessions,
  weekStartIso,
  orgGyms,
  currentGymId,
  canManage,
  defaultTrainerIds,
  lockTrainersToSelf = false,
  currentUserId,
  initialView,
  labels,
}: Props) {
  const d = getDictionary(locale);
  const router = useRouter();
  const [view, setView] = useState<ClassesView>(initialView);
  const [pendingNav, startNav] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editing, setEditing] = useState<ClassesPageClass | null>(null);
  const [archiving, setArchiving] = useState<ClassesPageClass | null>(null);
  const [scheduling, setScheduling] = useState<ClassesPageClass | null>(null);
  const [duplicating, setDuplicating] = useState<ClassesPageClass | null>(null);
  const [scheduleRecurrence, setScheduleRecurrence] = useState<"none" | "weekly">(
    "weekly",
  );

  const [createState, createAction, createPending] = useActionState(
    createClass,
    null as ClassFormState,
  );
  const [editState, editAction, editPending] = useActionState(
    updateClass,
    null as ClassFormState,
  );
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    createClassSchedule,
    null as ScheduleFormState,
  );

  const [prevCreateState, setPrevCreateState] = useState(createState);
  if (createState !== prevCreateState) {
    setPrevCreateState(createState);
    if (createState?.success) {
      setCreateOpen(false);
      setCreateKey((k) => k + 1);
    }
  }

  const [prevEditState, setPrevEditState] = useState(editState);
  if (editState !== prevEditState) {
    setPrevEditState(editState);
    if (editState?.success) setEditing(null);
  }

  const [prevScheduleState, setPrevScheduleState] = useState(scheduleState);
  if (scheduleState !== prevScheduleState) {
    setPrevScheduleState(scheduleState);
    if (scheduleState?.success) {
      setScheduling(null);
      setView("calendar");
    }
  }

  const weekStart = useMemo(() => new Date(weekStartIso), [weekStartIso]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ClassSessionRow[]>();
    for (const s of sessions) {
      const key = new Date(s.starts_at).toDateString();
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [sessions]);

  const visibleDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toDateString();
    const inWeek = days.some((d) => d.toDateString() === todayKey);

    return days.filter((day) => {
      const key = day.toDateString();
      const hasSessions = (sessionsByDay.get(key)?.length ?? 0) > 0;
      const isToday = inWeek && key === todayKey;
      return hasSessions || isToday;
    });
  }, [days, sessionsByDay]);

  const active = classes.filter((c) => c.is_active);
  const archived = classes.filter((c) => !c.is_active);
  const otherGyms = orgGyms.filter((g) => g.id !== currentGymId);
  const todayStr = new Date().toISOString().slice(0, 10);

  function selectView(next: ClassesView) {
    setView(next);
    const q = new URLSearchParams();
    q.set("tab", next);
    if (next === "calendar") {
      q.set("week", weekStart.toISOString().slice(0, 10));
    }
    startNav(() => {
      router.replace(`/${locale}/classes?${q.toString()}`, { scroll: false });
    });
  }

  function goWeek(delta: number) {
    const next = startOfWeekMonday(addDays(weekStart, delta * 7));
    const q = new URLSearchParams({
      tab: "calendar",
      week: next.toISOString().slice(0, 10),
    });
    setView("calendar");
    startNav(() => {
      router.push(`/${locale}/classes?${q.toString()}`);
    });
  }

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {d.classes.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {labels.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            role="tablist"
            aria-label={d.classes.title}
            className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5"
          >
            {(
              [
                {
                  id: "catalog" as const,
                  label: labels.tabCatalog,
                  icon: Layers,
                },
                {
                  id: "calendar" as const,
                  label: labels.tabCalendar,
                  icon: CalendarDays,
                },
              ] as const
            ).map((item) => {
              const selected = view === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`classes-view-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectView(item.id)}
                  disabled={pendingNav}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      selectView(item.id === "catalog" ? "calendar" : "catalog");
                    }
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-60 ${
                    selected
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          {canManage ? (
            <Button
              type="button"
              variant="primary"
              className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {labels.newClass}
            </Button>
          ) : null}
        </div>
      </header>

      <div
        role="tabpanel"
        aria-labelledby={`classes-view-${view}`}
        className="min-w-0"
      >
      {pendingNav ? (
        <ClassesLoadingSplash
          label={labels.loading}
          variant={view === "calendar" ? "calendar" : "catalog"}
        />
      ) : view === "catalog" ? (
        classes.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-14 text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-sm text-[var(--color-muted)]">{labels.noClasses}</p>
          </section>
        ) : (
          <div className="flex flex-col gap-4">
            {active.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-title text-xl font-bold text-[var(--color-text)]">
                        {c.name}
                      </h2>
                      <span className="rounded-md bg-[var(--color-success)]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                        {labels.active}
                      </span>
                    </div>
                    {c.description ? (
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {c.description}
                      </p>
                    ) : null}
                    {c.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {c.capacity != null
                          ? String(c.capacity)
                          : labels.unlimited}
                      </span>
                      <span>{c.duration_minutes} min</span>
                      <span>
                        {trainerCountLabel(
                          labels.trainerCount,
                          c.trainerIds.length,
                        )}
                        {c.trainerNames.length > 0
                          ? `: ${c.trainerNames.join(", ")}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {canManage ? (
                      <>
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleRecurrence("weekly");
                        setScheduling(c);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                      title={labels.schedule}
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      {labels.schedule}
                    </button>
                    {otherGyms.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setDuplicating(c)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                        aria-label={labels.duplicate}
                        title={labels.duplicate}
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                      aria-label={labels.edit}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiving(c)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)]"
                      aria-label={labels.archive}
                    >
                      <Archive className="h-4 w-4" aria-hidden />
                    </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}

            {archived.length > 0 ? (
              <div className="mt-2 flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {labels.archived}
                </h3>
                {archived.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
                        {c.name}
                      </h2>
                      <form action={setClassActive}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="class_id" value={c.id} />
                        <input type="hidden" name="is_active" value="true" />
                        <RestoreClassButton
                          label={labels.restore}
                          pendingLabel={labels.restoring}
                        />
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goWeek(-1)}
              disabled={pendingNav}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {labels.prevWeek}
            </button>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {labels.thisWeek}
            </p>
            <button
              type="button"
              onClick={() => goWeek(1)}
              disabled={pendingNav}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 text-sm disabled:opacity-50"
            >
              {labels.nextWeek}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`grid gap-2 ${
              visibleDays.length <= 1
                ? "grid-cols-1"
                : visibleDays.length === 2
                  ? "grid-cols-2"
                  : visibleDays.length === 3
                    ? "grid-cols-3"
                    : visibleDays.length === 4
                      ? "grid-cols-2 sm:grid-cols-4"
                      : visibleDays.length <= 5
                        ? "grid-cols-3 sm:grid-cols-5"
                        : visibleDays.length === 6
                          ? "grid-cols-3 sm:grid-cols-6"
                          : "grid-cols-7"
            }`}
          >
            {visibleDays.map((day) => {
              const list = sessionsByDay.get(day.toDateString()) ?? [];
              const isToday =
                day.toDateString() === new Date().toDateString();
              const dayLabel = day.toLocaleDateString(
                locale === "es" ? "es-MX" : "en-US",
                { weekday: "short" },
              );
              return (
                <section
                  key={day.toISOString()}
                  className={`flex min-h-[11rem] min-w-0 flex-col rounded-xl border bg-[var(--color-surface)] p-2 sm:p-3 ${
                    isToday
                      ? "border-[var(--color-primary)]/50 ring-1 ring-[var(--color-primary)]/20"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <header className="mb-2 flex items-center justify-between gap-2 px-0.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                      {dayLabel}
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                        isToday
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                          : "text-[var(--color-text)]"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </header>
                  {list.length === 0 ? (
                    <p className="mt-2 flex-1 text-center text-xs text-[var(--color-muted)]">
                      —
                    </p>
                  ) : (
                    <ul className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                      {list.map((s) => {
                        const seats =
                          s.capacity == null
                            ? labels.unlimited
                            : `${s.confirmed_count ?? 0}/${s.capacity}`;
                        const timeOnly = new Date(s.starts_at).toLocaleTimeString(
                          locale === "es" ? "es-MX" : "en-US",
                          { hour: "2-digit", minute: "2-digit" },
                        );
                        return (
                          <li key={s.id}>
                            <Link
                              href={`/${locale}/classes/${s.id}`}
                              className={`block rounded-lg border px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-hover)] ${
                                s.status === "cancelled"
                                  ? "border-[var(--color-border)] opacity-55"
                                  : "border-[var(--color-border)]"
                              }`}
                              title={`${s.class_name} · ${seats}`}
                            >
                              <p className="truncate text-xs font-semibold text-[var(--color-text)]">
                                {s.class_name}
                              </p>
                              <p className="truncate text-[10px] text-[var(--color-muted)]">
                                {timeOnly}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-[var(--color-muted)]">
                                {seats}
                                {(s.waitlist_count ?? 0) > 0
                                  ? ` · +${s.waitlist_count}`
                                  : ""}
                              </p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          {sessions.length === 0 && visibleDays.length === 0 ? (
            <p className="text-center text-sm text-[var(--color-muted)]">
              {labels.noSessions}
            </p>
          ) : null}
        </div>
      )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={labels.createTitle}
        description={labels.createDescription}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {createOpen ? (
          <form action={createAction} key={createKey} noValidate>
            <ClassFormFields
              locale={locale}
              state={createState}
              pending={createPending}
              submitLabel={labels.save}
              cancelLabel={labels.cancel}
              onCancel={() => setCreateOpen(false)}
              trainers={trainers}
              labels={labels}
              mode="create"
              lockTrainersToSelf={lockTrainersToSelf}
              lockedTrainerId={
                lockTrainersToSelf ? currentUserId : undefined
              }
              defaults={
                defaultTrainerIds?.length
                  ? {
                      name: "",
                      description: null,
                      capacity: null,
                      duration_minutes: 60,
                      tags: [],
                      trainerIds: defaultTrainerIds,
                    }
                  : undefined
              }
            />
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={labels.editTitle}
        description={labels.editDescription}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {editing ? (
          <form action={editAction} key={editing.id} noValidate>
            <input type="hidden" name="class_id" value={editing.id} />
            <ClassFormFields
              locale={locale}
              state={editState}
              pending={editPending}
              submitLabel={labels.save}
              cancelLabel={labels.cancel}
              onCancel={() => setEditing(null)}
              trainers={trainers}
              labels={labels}
              mode="edit"
              lockTrainersToSelf={lockTrainersToSelf}
              lockedTrainerId={
                lockTrainersToSelf ? currentUserId : undefined
              }
              defaults={{
                name: editing.name,
                description: editing.description,
                capacity: editing.capacity,
                duration_minutes: editing.duration_minutes,
                tags: editing.tags,
                trainerIds: editing.trainerIds,
              }}
            />
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(scheduling)}
        onOpenChange={(open) => {
          if (!open) setScheduling(null);
        }}
        title={labels.scheduleTitle}
        description={labels.scheduleHint}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {scheduling ? (
          <form action={scheduleAction} noValidate className="flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="class_id" value={scheduling.id} />
            <input type="hidden" name="timezone" value="America/Mexico_City" />
            <FormField label={labels.recurrence} variant="auth">
              <select
                name="recurrence"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
                value={scheduleRecurrence}
                onChange={(e) =>
                  setScheduleRecurrence(e.target.value as "none" | "weekly")
                }
              >
                <option value="weekly">{labels.recurrenceWeekly}</option>
                <option value="none">{labels.recurrenceNone}</option>
              </select>
            </FormField>
            {scheduleRecurrence === "weekly" ? (
              <WeekdayToggleGroup
                legend={labels.days}
                labels={[
                  labels.dayMon,
                  labels.dayTue,
                  labels.dayWed,
                  labels.dayThu,
                  labels.dayFri,
                  labels.daySat,
                  labels.daySun,
                ]}
                error={scheduleState?.fieldErrors?.days_of_week}
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={labels.time} variant="auth">
                <Input name="local_time" type="time" required variant="auth" defaultValue="07:00" />
              </FormField>
              <FormField label={labels.validFrom} variant="auth">
                <Input
                  name="valid_from"
                  type="date"
                  required
                  variant="auth"
                  defaultValue={todayStr}
                />
              </FormField>
            </div>
            <FormField label={labels.validUntil} variant="auth">
              <Input name="valid_until" type="date" variant="auth" />
            </FormField>
            {scheduleState?.error ? (
              <p className="text-sm text-[var(--color-primary)]" role="alert">
                {scheduleState.error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setScheduling(null)}>
                {labels.cancel}
              </Button>
              <Button type="submit" variant="primary" disabled={schedulePending} className="inline-flex items-center gap-2">
                {schedulePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {schedulePending ? d.classes.saving : labels.save}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(duplicating)}
        onOpenChange={(open) => {
          if (!open) setDuplicating(null);
        }}
        title={labels.duplicateTitle}
        description={labels.duplicateHint}
        closeLabel={labels.close}
        className="max-w-md"
      >
        {duplicating ? (
          <form
            className="flex flex-col gap-4"
            action={async (fd) => {
              await duplicateClassToGym(fd);
              setDuplicating(null);
            }}
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="class_id" value={duplicating.id} />
            <FormField label={labels.targetGym} variant="auth">
              <select
                name="target_gym_id"
                required
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
                defaultValue={otherGyms[0]?.id}
              >
                {otherGyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDuplicating(null)}>
                {labels.cancel}
              </Button>
              <Button type="submit" variant="primary">
                {labels.duplicate}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={labels.archive}
        description={
          archiving
            ? labels.archiveConfirm.replace("{name}", archiving.name)
            : undefined
        }
        closeLabel={labels.close}
        cancelLabel={labels.cancel}
        confirmLabel={labels.archive}
        pendingLabel={labels.archiving}
        action={setClassActive}
      >
        {archiving ? (
          <>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="class_id" value={archiving.id} />
            <input type="hidden" name="is_active" value="false" />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
