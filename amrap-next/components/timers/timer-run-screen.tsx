"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { expandRoutine } from "@/lib/timers/timeline";
import {
  MUTE_KEY,
  formatClock,
  playBeep,
  type TimerRoutine,
} from "@/lib/timers/types";

type Labels = Dictionary["timers"];

type Props = {
  routine: TimerRoutine;
  labels: Labels;
  onClose: () => void;
  onEdit: () => void;
};

export function TimerRunScreen({ routine, labels, onClose, onEdit }: Props) {
  const timeline = useMemo(() => expandRoutine(routine), [routine]);
  const totalAll = useMemo(
    () => timeline.reduce((s, t) => s + t.seconds, 0),
    [timeline],
  );

  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [phaseLeft, setPhaseLeft] = useState(
    () => timeline[0]?.seconds ?? 0,
  );
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);

  const endAtRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const timelineRef = useRef(timeline);

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const goToIndex = useCallback((next: number, autoStart: boolean) => {
    const list = timelineRef.current;
    if (list.length === 0) return;
    const clamped = Math.max(0, Math.min(list.length - 1, next));
    setIndex(clamped);
    indexRef.current = clamped;
    setDone(false);
    const sec = list[clamped]!.seconds;
    setPhaseLeft(sec);
    if (autoStart) {
      endAtRef.current = Date.now() + sec * 1000;
      setRunning(true);
    } else {
      endAtRef.current = null;
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = Math.ceil((endAt - Date.now()) / 1000);
      if (left > 0) {
        setPhaseLeft(left);
        return;
      }

      const list = timelineRef.current;
      const mutedNow =
        typeof window !== "undefined" &&
        localStorage.getItem(MUTE_KEY) === "1";
      const next = indexRef.current + 1;
      if (next >= list.length) {
        playBeep("end", mutedNow);
        setPhaseLeft(0);
        setRunning(false);
        setDone(true);
        endAtRef.current = null;
        return;
      }
      playBeep(list[next]?.kind === "rest" ? "rest" : "interval", mutedNow);
      goToIndex(next, true);
    }, 200);
    return () => window.clearInterval(id);
  }, [running, goToIndex]);

  const current = timeline[index];
  const completedBefore = timeline
    .slice(0, index)
    .reduce((s, t) => s + t.seconds, 0);
  const phaseDuration = current?.seconds ?? 0;
  const elapsedInPhase = Math.max(0, phaseDuration - phaseLeft);
  const elapsed = done ? totalAll : completedBefore + elapsedInPhase;
  const remaining = Math.max(0, totalAll - elapsed);

  function resetToStart() {
    setRunning(false);
    setDone(false);
    setIndex(0);
    indexRef.current = 0;
    endAtRef.current = null;
    setPhaseLeft(timeline[0]?.seconds ?? 0);
  }

  function start() {
    if (timeline.length === 0) return;
    if (done) resetToStart();
    const left =
      phaseLeft > 0 ? phaseLeft : timeline[index]?.seconds ?? 0;
    setPhaseLeft(left);
    endAtRef.current = Date.now() + left * 1000;
    setRunning(true);
    setDone(false);
    playBeep("start", muted);
  }

  function pause() {
    if (!running || !endAtRef.current) return;
    const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
    setPhaseLeft(left);
    endAtRef.current = null;
    setRunning(false);
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function guarded(fn: () => void) {
    if (locked) return;
    fn();
  }

  const phaseLabel = done
    ? labels.phaseDone
    : current?.label || labels.phaseReady;

  const setLabel =
    current && current.setTotal > 1
      ? labels.roundOf
          .replace("{current}", String(current.setIndex))
          .replace("{total}", String(current.setTotal))
      : current
        ? labels.setOf
            .replace("{current}", String(current.setIndex))
            .replace("{total}", String(current.setTotal))
        : "";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col text-white"
      style={{ backgroundColor: routine.color }}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5">
        <button
          type="button"
          onClick={() => guarded(onClose)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
          aria-label={labels.closeRun}
          disabled={locked}
        >
          <X className="h-7 w-7" aria-hidden />
        </button>
        <h1 className="truncate text-center font-title text-xl font-bold tracking-tight sm:text-2xl">
          {routine.name}
        </h1>
        <div className="flex items-center gap-2 justify-self-end">
          <button
            type="button"
            onClick={() => guarded(onEdit)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label={labels.edit}
            disabled={locked}
          >
            <Pencil className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
            aria-label={muted ? labels.unmute : labels.mute}
          >
            {muted ? (
              <VolumeX className="h-6 w-6" aria-hidden />
            ) : (
              <Volume2 className="h-6 w-6" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <p className="font-title text-[5.5rem] font-bold leading-none tabular-nums tracking-tight sm:text-[7rem]">
          {formatClock(done ? 0 : phaseLeft)}
        </p>

        <div className="mt-8 flex w-full max-w-md items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            disabled={locked || index <= 0}
            onClick={() => goToIndex(index - 1, false)}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label={labels.prevPhase}
          >
            <ChevronLeft className="h-8 w-8" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xl font-semibold sm:text-2xl">
              {phaseLabel}
            </p>
            {setLabel ? (
              <p className="mt-1 text-base text-white/80">{setLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={locked || index >= timeline.length - 1}
            onClick={() => goToIndex(index + 1, running)}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
            aria-label={labels.nextPhase}
          >
            <ChevronRight className="h-8 w-8" aria-hidden />
          </button>
        </div>

        <div className="mt-10 grid w-full max-w-sm grid-cols-2 gap-8 text-center">
          <div>
            <p className="font-title text-3xl font-bold tabular-nums sm:text-4xl">
              {formatClock(elapsed)}
            </p>
            <p className="mt-1.5 text-sm font-semibold uppercase tracking-wider text-white/75">
              {labels.elapsed}
            </p>
          </div>
          <div>
            <p className="font-title text-3xl font-bold tabular-nums sm:text-4xl">
              {formatClock(remaining)}
            </p>
            <p className="mt-1.5 text-sm font-semibold uppercase tracking-wider text-white/75">
              {labels.remaining}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4 sm:gap-8">
        <button
          type="button"
          onClick={() => setLocked((l) => !l)}
          className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/45 bg-white/10"
          aria-label={locked ? labels.unlock : labels.lock}
          aria-pressed={locked}
        >
          {locked ? (
            <Lock className="h-8 w-8" aria-hidden />
          ) : (
            <Unlock className="h-8 w-8" aria-hidden />
          )}
        </button>

        {!running ? (
          <button
            type="button"
            disabled={locked || timeline.length === 0}
            onClick={() => guarded(start)}
            className="inline-flex h-36 w-36 flex-col items-center justify-center rounded-full border-[3px] border-white text-lg font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Play className="mb-1.5 h-10 w-10 fill-current" aria-hidden />
            {labels.start}
          </button>
        ) : (
          <button
            type="button"
            disabled={locked}
            onClick={() => guarded(pause)}
            className="inline-flex h-36 w-36 flex-col items-center justify-center rounded-full border-[3px] border-white text-lg font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Pause className="mb-1.5 h-10 w-10 fill-current" aria-hidden />
            {labels.pause}
          </button>
        )}

        <button
          type="button"
          disabled={locked}
          onClick={() => guarded(resetToStart)}
          className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/45 bg-white/10 disabled:opacity-50"
          aria-label={labels.reset}
        >
          <RotateCcw className="h-8 w-8" aria-hidden />
        </button>
      </div>

      {locked ? (
        <p className="pb-4 text-center text-sm text-white/75">
          {labels.lockedHint}
        </p>
      ) : null}
    </div>
  );
}
