export type PhaseKind = "warmup" | "work" | "rest" | "cooldown";

export type TimerPhase = {
  id: string;
  kind: PhaseKind;
  label: string;
  seconds: number;
};

export type TimerCycle = {
  id: string;
  sets: number;
  phases: TimerPhase[];
};

type TimerRoutineType = "simple" | "complex";

export type TimerRoutine = {
  id: string;
  name: string;
  /** CSS hex color used as run-screen background accent */
  color: string;
  type: TimerRoutineType;
  templateId?: string;
  /** Simple: warmup / work / rest / cooldown in order */
  phases?: TimerPhase[];
  /** Simple: how many times to repeat the work+rest block */
  repeatSets?: number;
  /** Complex */
  warmupSeconds?: number;
  cooldownSeconds?: number;
  cycles?: TimerCycle[];
  updatedAt: number;
};

export type TimelineSegment = {
  id: string;
  kind: PhaseKind;
  label: string;
  seconds: number;
  setIndex: number;
  setTotal: number;
};

export const TIMER_COLORS = [
  "#e11d48", // rose/red (HIIT default)
  "#16a34a", // green
  "#2563eb", // blue
  "#d97706", // amber
  "#0d9488", // teal
  "#7c3aed", // violet
] as const;

export const MUTE_KEY = "amrap_timer_mute";
export const ROUTINES_KEY = "amrap_timer_routines";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${pad2(m)}:${pad2(r)}`;
}

export { playBeep, unlockTimerAudio } from "$lib/timers/sound";
export type { TimerBeepKind } from "$lib/timers/sound";
