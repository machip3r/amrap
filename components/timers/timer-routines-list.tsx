"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatClock, type TimerRoutine } from "@/lib/timers/types";
import { totalSeconds } from "@/lib/timers/timeline";
import { Button } from "@/components/ui/button";

type Labels = Dictionary["timers"];

type Props = {
  routines: TimerRoutine[];
  labels: Labels;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
};

export function TimerRoutinesList({
  routines,
  labels,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-title text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {labels.routinesTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {labels.routinesSubtitle}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 text-sm leading-none shadow-sm"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <span className="shrink-0">{labels.create}</span>
        </Button>
      </header>

      {routines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
          {labels.emptyRoutines}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {routines.map((r) => (
            <li key={r.id}>
              <div className="flex overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                <button
                  type="button"
                  onClick={() => onOpen(r.id)}
                  className="flex min-h-24 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-5 text-left transition-colors hover:bg-[var(--color-surface-hover)]/60 sm:min-h-20 sm:py-4"
                >
                  <span className="truncate text-xl font-semibold text-[var(--color-text)] sm:text-lg">
                    {r.name || labels.unnamed}
                  </span>
                  <span className="shrink-0 tabular-nums text-lg font-medium text-[var(--color-muted)] sm:text-base">
                    {formatClock(totalSeconds(r))}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-0.5 border-l border-[var(--color-border)] px-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(r.id)}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                    aria-label={labels.edit}
                    title={labels.edit}
                  >
                    <Pencil className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                    aria-label={labels.delete}
                    title={labels.delete}
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
