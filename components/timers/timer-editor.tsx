"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  blankComplexRoutine,
  blankSimpleRoutine,
  createFromTemplate,
  TEMPLATE_OPTIONS,
  type TemplateId,
} from "@/lib/timers/templates";
import { segmentBarParts, totalSeconds } from "@/lib/timers/timeline";
import {
  TIMER_COLORS,
  formatClock,
  newId,
  type TimerCycle,
  type TimerPhase,
  type TimerRoutine,
} from "@/lib/timers/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Labels = Dictionary["timers"];

type Props = {
  initial: TimerRoutine | null;
  labels: Labels;
  closeLabel: string;
  onCancel: () => void;
  onSave: (routine: TimerRoutine) => void;
};

function TimePill({
  seconds,
  colorClass,
  onChange,
  minutesLabel,
  secondsLabel,
}: {
  seconds: number;
  colorClass: string;
  onChange: (sec: number) => void;
  minutesLabel: string;
  secondsLabel: string;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div
      className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-1.5 ${colorClass}`}
    >
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        value={mins}
        onChange={(e) => {
          const m = Math.max(0, Number(e.target.value) || 0);
          onChange(m * 60 + secs);
        }}
        className="w-9 bg-transparent text-center text-base font-bold tabular-nums text-white outline-none"
        aria-label={minutesLabel}
      />
      <span className="text-base font-bold text-white/85">:</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={59}
        value={secs}
        onChange={(e) => {
          const s = Math.min(59, Math.max(0, Number(e.target.value) || 0));
          onChange(mins * 60 + s);
        }}
        className="w-9 bg-transparent text-center text-base font-bold tabular-nums text-white outline-none"
        aria-label={secondsLabel}
      />
    </div>
  );
}

function ensureSimplePhases(r: TimerRoutine): TimerPhase[] {
  if (r.phases && r.phases.length >= 4) return r.phases;
  const base = blankSimpleRoutine().phases!;
  return base.map((p) => {
    const existing = r.phases?.find((x) => x.kind === p.kind);
    return existing ?? p;
  });
}

export function TimerEditor({
  initial,
  labels,
  closeLabel,
  onCancel,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<TimerRoutine>(() => {
    if (initial) {
      return {
        ...initial,
        phases:
          initial.type === "simple"
            ? ensureSimplePhases(initial)
            : initial.phases,
      };
    }
    return blankSimpleRoutine();
  });

  const total = useMemo(() => totalSeconds(draft), [draft]);
  const bar = useMemo(() => segmentBarParts(draft), [draft]);
  const canSave = total > 0;

  function setPhaseSeconds(kind: TimerPhase["kind"], seconds: number) {
    setDraft((d) => {
      const phases = ensureSimplePhases(d).map((p) =>
        p.kind === kind ? { ...p, seconds } : p,
      );
      return { ...d, phases, templateId: undefined };
    });
  }

  function applyTemplate(id: TemplateId) {
    const t = createFromTemplate(id);
    setDraft((d) => ({
      ...t,
      id: d.id,
      name: !initial || !d.name.trim() ? t.name : d.name,
      updatedAt: d.updatedAt,
    }));
  }

  function switchType(type: "simple" | "complex") {
    if (type === draft.type) return;
    if (type === "simple") {
      const s = blankSimpleRoutine();
      setDraft({
        ...s,
        id: draft.id,
        name: draft.name,
        color: draft.color,
        updatedAt: draft.updatedAt,
        templateId: undefined,
      });
    } else {
      const c = blankComplexRoutine();
      setDraft({
        ...c,
        id: draft.id,
        name: draft.name,
        color: draft.color,
        updatedAt: draft.updatedAt,
        templateId: undefined,
      });
    }
  }

  function updateCycle(cycleId: string, patch: Partial<TimerCycle>) {
    setDraft((d) => ({
      ...d,
      templateId: undefined,
      cycles: (d.cycles ?? []).map((c) =>
        c.id === cycleId ? { ...c, ...patch } : c,
      ),
    }));
  }

  function updateCyclePhase(
    cycleId: string,
    phaseId: string,
    seconds: number,
  ) {
    setDraft((d) => ({
      ...d,
      templateId: undefined,
      cycles: (d.cycles ?? []).map((c) =>
        c.id !== cycleId
          ? c
          : {
              ...c,
              phases: c.phases.map((p) =>
                p.id === phaseId ? { ...p, seconds } : p,
              ),
            },
      ),
    }));
  }

  function addCycle() {
    const cycle: TimerCycle = {
      id: newId(),
      sets: 1,
      phases: [
        {
          id: newId(),
          kind: "work",
          label: "High Intensity",
          seconds: 20,
        },
        {
          id: newId(),
          kind: "rest",
          label: "Low Intensity",
          seconds: 10,
        },
      ],
    };
    setDraft((d) => ({
      ...d,
      templateId: undefined,
      cycles: [...(d.cycles ?? []), cycle],
    }));
  }

  function removeCycle(cycleId: string) {
    setDraft((d) => ({
      ...d,
      templateId: undefined,
      cycles: (d.cycles ?? []).filter((c) => c.id !== cycleId),
    }));
  }

  const phases = draft.type === "simple" ? ensureSimplePhases(draft) : [];
  const warmup = phases.find((p) => p.kind === "warmup");
  const work = phases.find((p) => p.kind === "work");
  const rest = phases.find((p) => p.kind === "rest");
  const cooldown = phases.find((p) => p.kind === "cooldown");

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-8rem)] flex-col bg-[var(--color-bg)] md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-4 py-2 backdrop-blur-sm md:px-6 lg:px-8">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 min-w-11 px-1 text-sm font-semibold text-[var(--color-primary)]"
        >
          {closeLabel}
        </button>
        <h2 className="truncate font-title text-base font-bold text-[var(--color-text)] sm:text-lg">
          {initial ? labels.editTitle : labels.createTitle}
        </h2>
        <Button
          type="button"
          variant="primary"
          disabled={!canSave}
          className="h-10 shrink-0 px-4 text-sm shadow-sm"
          onClick={() =>
            onSave({
              ...draft,
              name: draft.name.trim() || labels.unnamed,
            })
          }
        >
          {labels.save}
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.namePlaceholder}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {TIMER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, color: c, templateId: undefined }))
                  }
                  className={`h-10 w-10 rounded-lg border-2 ${
                    draft.color === c
                      ? "border-[var(--color-text)]"
                      : "border-transparent opacity-80"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                  aria-pressed={draft.color === c}
                />
              ))}
            </div>
            <Input
              variant="auth"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  name: e.target.value,
                  templateId: undefined,
                }))
              }
              placeholder={labels.namePlaceholder}
              className="min-h-11 flex-1"
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {labels.template}
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_OPTIONS.map((o) => {
              const active = draft.templateId === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => applyTemplate(o.id)}
                  className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  }`}
                >
                  {labels[o.nameKey]}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {labels.type}
          </span>
          <div className="inline-flex rounded-lg bg-[var(--color-surface-hover)] p-0.5">
            {(["simple", "complex"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                className={`min-h-10 rounded-md px-3.5 text-sm font-bold ${
                  draft.type === t
                    ? "bg-[var(--color-text)] text-[var(--color-bg)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {t === "simple" ? labels.typeSimple : labels.typeComplex}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {draft.type === "simple" ? (
            <ul className="divide-y divide-[var(--color-border)]">
              <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium sm:text-base">
                  {labels.phaseWarmup}
                </span>
                <TimePill
                  seconds={warmup?.seconds ?? 0}
                  colorClass="bg-amber-500"
                  onChange={(s) => setPhaseSeconds("warmup", s)}
                  minutesLabel={labels.minutes}
                  secondsLabel={labels.seconds}
                />
              </li>
              <li className="flex min-h-12 items-center justify-between gap-3 bg-[var(--color-surface-hover)]/40 px-4 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {labels.intervalCycle}
                </span>
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
                  {labels.sets}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99}
                    value={draft.repeatSets ?? 1}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        templateId: undefined,
                        repeatSets: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="min-h-10 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-base font-semibold tabular-nums text-[var(--color-text)]"
                  />
                </label>
              </li>
              <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium sm:text-base">
                  {labels.phaseWork}
                </span>
                <TimePill
                  seconds={work?.seconds ?? 0}
                  colorClass="bg-rose-600"
                  onChange={(s) => setPhaseSeconds("work", s)}
                  minutesLabel={labels.minutes}
                  secondsLabel={labels.seconds}
                />
              </li>
              <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium sm:text-base">
                  {labels.phaseRest}
                </span>
                <TimePill
                  seconds={rest?.seconds ?? 0}
                  colorClass="bg-green-600"
                  onChange={(s) => setPhaseSeconds("rest", s)}
                  minutesLabel={labels.minutes}
                  secondsLabel={labels.seconds}
                />
              </li>
              <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium sm:text-base">
                  {labels.phaseCooldown}
                </span>
                <TimePill
                  seconds={cooldown?.seconds ?? 0}
                  colorClass="bg-blue-600"
                  onChange={(s) => setPhaseSeconds("cooldown", s)}
                  minutesLabel={labels.minutes}
                  secondsLabel={labels.seconds}
                />
              </li>
            </ul>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium sm:text-base">
                  {labels.phaseWarmup}
                </span>
                <TimePill
                  seconds={draft.warmupSeconds ?? 0}
                  colorClass="bg-amber-500"
                  onChange={(s) =>
                    setDraft((d) => ({
                      ...d,
                      warmupSeconds: s,
                      templateId: undefined,
                    }))
                  }
                  minutesLabel={labels.minutes}
                  secondsLabel={labels.seconds}
                />
              </li>
              {(draft.cycles ?? []).map((cycle, idx) => (
                <li
                  key={cycle.id}
                  className="bg-[var(--color-surface-hover)]/30"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      {labels.intervalCycle} {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
                        {labels.sets}
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={99}
                          value={cycle.sets}
                          onChange={(e) =>
                            updateCycle(cycle.id, {
                              sets: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="min-h-10 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-base font-semibold tabular-nums"
                        />
                      </label>
                      {(draft.cycles?.length ?? 0) > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeCycle(cycle.id)}
                          className="inline-flex h-10 w-10 items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                          aria-label={labels.delete}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {cycle.phases.map((p) => (
                    <div
                      key={p.id}
                      className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="text-sm font-medium sm:text-base">
                        {p.kind === "work"
                          ? labels.phaseWork
                          : labels.phaseRest}
                      </span>
                      <TimePill
                        seconds={p.seconds}
                        colorClass={
                          p.kind === "work" ? "bg-rose-600" : "bg-green-600"
                        }
                        onChange={(s) => updateCyclePhase(cycle.id, p.id, s)}
                        minutesLabel={labels.minutes}
                        secondsLabel={labels.seconds}
                      />
                    </div>
                  ))}
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={addCycle}
                  className="flex min-h-12 w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-500/10"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {labels.addCycle}
                </button>
              </li>
              <li className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium sm:text-base">
                  {labels.phaseCooldown}
                </span>
                <TimePill
                  seconds={draft.cooldownSeconds ?? 0}
                  colorClass="bg-blue-600"
                  onChange={(s) =>
                    setDraft((d) => ({
                      ...d,
                      cooldownSeconds: s,
                      templateId: undefined,
                    }))
                  }
                  minutesLabel={labels.minutes}
                  secondsLabel={labels.seconds}
                />
              </li>
            </ul>
          )}
        </div>

        <div className="sticky bottom-0 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm">
          <p className="text-center text-base font-semibold tabular-nums text-[var(--color-text)]">
            {labels.total}: {formatClock(total)}
          </p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
            {bar.length === 0 || total <= 0 ? (
              <div className="h-full w-full bg-[var(--color-border)]" />
            ) : (
              bar.map((part, i) => (
                <div
                  key={`${part.kind}-${i}`}
                  className="h-full"
                  style={{
                    width: `${(part.seconds / total) * 100}%`,
                    backgroundColor: part.color,
                  }}
                />
              ))
            )}
          </div>
          {!canSave ? (
            <p className="text-center text-xs text-[var(--color-muted)]">
              {labels.needDuration}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
