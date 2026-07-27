export type PhaseKind = "warmup" | "work" | "rest" | "cooldown";

/** Bell strikes when a phase starts (`none` = silent). */
export type TimerPhaseCue = "none" | "once" | "twice";

export type TimerPhase = {
  id: string;
  kind: PhaseKind;
  label: string;
  seconds: number;
  /** Total-bar / segment color; falls back to kind default when missing. */
  color?: string;
  /** Start-of-phase cue; falls back to kind default when missing. */
  cue?: TimerPhaseCue;
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
  warmupColor?: string;
  warmupCue?: TimerPhaseCue;
  cooldownColor?: string;
  cooldownCue?: TimerPhaseCue;
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
  color: string;
  cue: TimerPhaseCue;
};

export const TIMER_COLORS = [
  "#e11d48", // rose/red (HIIT default)
  "#16a34a", // green
  "#2563eb", // blue
  "#d97706", // amber
  "#0d9488", // teal
  "#7c3aed", // violet
  "#eab308", // yellow (warmup default)
] as const;

export const PHASE_KIND_COLOR: Record<PhaseKind, string> = {
  warmup: "#eab308",
  work: "#e11d48",
  rest: "#16a34a",
  cooldown: "#2563eb",
};

export const PHASE_KIND_CUE: Record<PhaseKind, TimerPhaseCue> = {
  warmup: "none",
  work: "twice",
  rest: "once",
  cooldown: "none",
};

export function resolvePhaseColor(kind: PhaseKind, color?: string): string {
  return color && color.trim() ? color : PHASE_KIND_COLOR[kind];
}

export function resolvePhaseCue(kind: PhaseKind, cue?: TimerPhaseCue): TimerPhaseCue {
  return cue ?? PHASE_KIND_CUE[kind];
}

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

export { playBeep, playPhaseCue, unlockTimerAudio } from "$lib/timers/sound";
export type { TimerBeepKind } from "$lib/timers/sound";
