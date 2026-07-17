"use client";

import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  deleteRoutine,
  getRoutinesSnapshot,
  subscribeRoutines,
  upsertRoutine,
} from "@/lib/timers/storage";
import type { TimerRoutine } from "@/lib/timers/types";
import { TimerEditor } from "@/components/timers/timer-editor";
import { TimerRoutinesList } from "@/components/timers/timer-routines-list";
import { TimerRunScreen } from "@/components/timers/timer-run-screen";

type View =
  | { kind: "list" }
  | { kind: "edit"; routine: TimerRoutine | null }
  | { kind: "run"; routineId: string };

type Props = {
  locale: Locale;
};

const EMPTY_ROUTINES: TimerRoutine[] = [];

export function TimerApp({ locale }: Props) {
  const d = getDictionary(locale);
  const labels = d.timers;

  const routines = useSyncExternalStore(
    subscribeRoutines,
    getRoutinesSnapshot,
    () => EMPTY_ROUTINES,
  );
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [view, setView] = useState<View>({ kind: "list" });

  const runRoutine =
    view.kind === "run"
      ? routines.find((r) => r.id === view.routineId) ?? null
      : null;

  if (!hydrated) {
    return (
      <p className="text-sm text-[var(--color-muted)]">{d.common.loading}</p>
    );
  }

  if (view.kind === "edit") {
    return (
      <TimerEditor
        initial={view.routine}
        labels={labels}
        closeLabel={d.registerUser.close}
        onCancel={() => setView({ kind: "list" })}
        onSave={(routine) => {
          upsertRoutine(routine);
          setView({ kind: "list" });
        }}
      />
    );
  }

  if (view.kind === "run" && runRoutine) {
    return (
      <TimerRunScreen
        key={runRoutine.id}
        routine={runRoutine}
        labels={labels}
        onClose={() => setView({ kind: "list" })}
        onEdit={() =>
          setView({ kind: "edit", routine: runRoutine })
        }
      />
    );
  }

  return (
    <TimerRoutinesList
      routines={routines}
      labels={labels}
      onOpen={(id) => setView({ kind: "run", routineId: id })}
      onEdit={(id) => {
        const r = routines.find((x) => x.id === id) ?? null;
        setView({ kind: "edit", routine: r });
      }}
      onDelete={(id) => {
        if (!window.confirm(labels.deleteConfirm)) return;
        deleteRoutine(id);
      }}
      onCreate={() => setView({ kind: "edit", routine: null })}
    />
  );
}
