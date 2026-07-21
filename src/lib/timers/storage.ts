import { seedRoutines } from "$lib/timers/templates";
import { ROUTINES_KEY, type TimerRoutine } from "$lib/timers/types";

type Listener = () => void;

const listeners = new Set<Listener>();
let memory: TimerRoutine[] | null = null;

function isRoutine(value: unknown): value is TimerRoutine {
  if (!value || typeof value !== "object") return false;
  const r = value as TimerRoutine;
  return (
    typeof r.id === "string" &&
    typeof r.name === "string" &&
    typeof r.color === "string" &&
    (r.type === "simple" || r.type === "complex") &&
    typeof r.updatedAt === "number"
  );
}

function readFromLocalStorage(): TimerRoutine[] {
  try {
    const raw = localStorage.getItem(ROUTINES_KEY);
    if (!raw) {
      const seeded = seedRoutines();
      localStorage.setItem(ROUTINES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      const seeded = seedRoutines();
      localStorage.setItem(ROUTINES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const list = parsed.filter(isRoutine);
    if (list.length === 0) {
      const seeded = seedRoutines();
      localStorage.setItem(ROUTINES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return seedRoutines();
  }
}

function writeToLocalStorage(routines: TimerRoutine[]) {
  try {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeRoutines(onStoreChange: Listener) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getRoutinesSnapshot(): TimerRoutine[] {
  if (typeof window === "undefined") return [];
  if (!memory) memory = readFromLocalStorage();
  return memory;
}

export function upsertRoutine(routine: TimerRoutine): TimerRoutine[] {
  const current = getRoutinesSnapshot();
  const next = [...current];
  const i = next.findIndex((r) => r.id === routine.id);
  const updated = { ...routine, updatedAt: Date.now() };
  if (i >= 0) next[i] = updated;
  else next.unshift(updated);
  memory = next.sort((a, b) => b.updatedAt - a.updatedAt);
  writeToLocalStorage(memory);
  emit();
  return memory;
}

export function deleteRoutine(id: string): TimerRoutine[] {
  const current = getRoutinesSnapshot();
  memory = current.filter((r) => r.id !== id);
  writeToLocalStorage(memory);
  emit();
  return memory;
}
