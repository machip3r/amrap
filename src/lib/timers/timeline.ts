import type {
  PhaseKind,
  TimelineSegment,
  TimerPhase,
  TimerPhaseCue,
  TimerRoutine,
} from "$lib/timers/types";
import {
  newId,
  resolvePhaseColor,
  resolvePhaseCue,
} from "$lib/timers/types";

function seg(
  kind: PhaseKind,
  label: string,
  seconds: number,
  setIndex: number,
  setTotal: number,
  color?: string,
  cue?: TimerPhaseCue,
): TimelineSegment | null {
  if (seconds <= 0) return null;
  return {
    id: newId(),
    kind,
    label,
    seconds,
    setIndex,
    setTotal,
    color: resolvePhaseColor(kind, color),
    cue: resolvePhaseCue(kind, cue),
  };
}

function segFromPhase(
  p: TimerPhase,
  setIndex: number,
  setTotal: number,
): TimelineSegment | null {
  return seg(p.kind, p.label, p.seconds, setIndex, setTotal, p.color, p.cue);
}

/** Expand a routine into a flat runnable timeline (skips 0-second phases). */
export function expandRoutine(routine: TimerRoutine): TimelineSegment[] {
  const out: TimelineSegment[] = [];

  if (routine.type === "complex") {
    const warm = seg(
      "warmup",
      "Warm Up",
      routine.warmupSeconds ?? 0,
      1,
      1,
      routine.warmupColor,
      routine.warmupCue,
    );
    if (warm) out.push(warm);

    for (const cycle of routine.cycles ?? []) {
      const sets = Math.max(1, cycle.sets || 1);
      for (let s = 1; s <= sets; s++) {
        for (const p of cycle.phases) {
          const item = segFromPhase(p, s, sets);
          if (item) out.push(item);
        }
      }
    }

    const cool = seg(
      "cooldown",
      "Cool Down",
      routine.cooldownSeconds ?? 0,
      1,
      1,
      routine.cooldownColor,
      routine.cooldownCue,
    );
    if (cool) out.push(cool);
    return out;
  }

  // simple
  const phases = routine.phases ?? [];
  const warmup = phases.find((p) => p.kind === "warmup");
  const work = phases.find((p) => p.kind === "work");
  const rest = phases.find((p) => p.kind === "rest");
  const cooldown = phases.find((p) => p.kind === "cooldown");
  const sets = Math.max(1, routine.repeatSets ?? 1);

  const w = seg(
    "warmup",
    warmup?.label ?? "Warm Up",
    warmup?.seconds ?? 0,
    1,
    1,
    warmup?.color,
    warmup?.cue,
  );
  if (w) out.push(w);

  for (let s = 1; s <= sets; s++) {
    const wk = seg(
      "work",
      work?.label ?? "High Intensity",
      work?.seconds ?? 0,
      s,
      sets,
      work?.color,
      work?.cue,
    );
    if (wk) out.push(wk);
    const rs = seg(
      "rest",
      rest?.label ?? "Low Intensity",
      rest?.seconds ?? 0,
      s,
      sets,
      rest?.color,
      rest?.cue,
    );
    if (rs) out.push(rs);
  }

  const c = seg(
    "cooldown",
    cooldown?.label ?? "Cool Down",
    cooldown?.seconds ?? 0,
    1,
    1,
    cooldown?.color,
    cooldown?.cue,
  );
  if (c) out.push(c);

  return out;
}

export function totalSeconds(routine: TimerRoutine): number {
  return expandRoutine(routine).reduce((sum, s) => sum + s.seconds, 0);
}

export function segmentBarParts(
  routine: TimerRoutine,
): { kind: PhaseKind; seconds: number; color: string }[] {
  return expandRoutine(routine).map((s) => ({
    kind: s.kind,
    seconds: s.seconds,
    color: s.color,
  }));
}
