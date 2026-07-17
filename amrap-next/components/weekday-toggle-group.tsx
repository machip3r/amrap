"use client";

import { useState } from "react";

const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

type Props = {
  name?: string;
  labels: readonly [string, string, string, string, string, string, string];
  defaultSelected?: number[];
  error?: string;
  legend: string;
};

export function WeekdayToggleGroup({
  name = "days_of_week",
  labels,
  defaultSelected = [1, 2, 3, 4, 5],
  error,
  legend,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(defaultSelected),
  );

  function toggle(day: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-[var(--color-text)]">
        {legend}
      </legend>
      <div
        className="grid grid-cols-7 gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1.5"
        role="group"
        aria-label={legend}
      >
        {ISO_DAYS.map((day, i) => {
          const on = selected.has(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(day)}
              className={`flex min-h-11 items-center justify-center rounded-md px-0.5 text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:text-xs ${
                on
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-on)] shadow-sm"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              }`}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>
      {[...selected].sort((a, b) => a - b).map((day) => (
        <input key={day} type="hidden" name={name} value={day} />
      ))}
      {error ? (
        <p className="mt-1.5 text-sm text-[var(--color-primary)]" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
