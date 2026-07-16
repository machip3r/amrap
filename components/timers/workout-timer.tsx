"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TimerMode = "countdown" | "amrap" | "emom" | "tabata";

type Phase = "idle" | "work" | "rest" | "done";

const MUTE_KEY = "amrap_timer_mute";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${pad(m)}:${pad(r)}`;
}

function playBeep(kind: "start" | "interval" | "end", muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    const freq = kind === "end" ? 880 : kind === "interval" ? 660 : 520;
    const dur = kind === "end" ? 0.35 : 0.12;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    /* ignore audio failures */
  }
}

type Props = {
  locale: Locale;
};

export function WorkoutTimer({ locale }: Props) {
  const d = getDictionary(locale);
  const t = d.timers;

  const [mode, setMode] = useState<TimerMode>("amrap");
  const [workMin, setWorkMin] = useState(10);
  const [emomSec, setEmomSec] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displaySec, setDisplaySec] = useState(0);
  const [round, setRound] = useState(1);
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const endAtRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const roundRef = useRef(1);
  const modeConfigRef = useRef({
    mode,
    workMin,
    emomSec,
    emomRounds,
    tabataWork,
    tabataRest,
    tabataRounds,
  });

  useEffect(() => {
    modeConfigRef.current = {
      mode,
      workMin,
      emomSec,
      emomRounds,
      tabataWork,
      tabataRest,
      tabataRounds,
    };
  }, [mode, workMin, emomSec, emomRounds, tabataWork, tabataRest, tabataRounds]);

  const idleSeconds =
    mode === "countdown" || mode === "amrap"
      ? workMin * 60
      : mode === "emom"
        ? emomSec
        : tabataWork;

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const resetIdle = useCallback(() => {
    setRunning(false);
    setPhase("idle");
    phaseRef.current = "idle";
    setRound(1);
    roundRef.current = 1;
    endAtRef.current = null;
    const cfg = modeConfigRef.current;
    if (cfg.mode === "countdown" || cfg.mode === "amrap") {
      setDisplaySec(cfg.workMin * 60);
    } else if (cfg.mode === "emom") {
      setDisplaySec(cfg.emomSec);
    } else {
      setDisplaySec(cfg.tabataWork);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const left = Math.ceil((endAt - Date.now()) / 1000);
      if (left > 0) {
        setDisplaySec(left);
        return;
      }

      const cfg = modeConfigRef.current;
      const mutedNow = localStorage.getItem(MUTE_KEY) === "1";

      if (cfg.mode === "countdown" || cfg.mode === "amrap") {
        playBeep("end", mutedNow);
        setDisplaySec(0);
        setPhase("done");
        phaseRef.current = "done";
        setRunning(false);
        endAtRef.current = null;
        return;
      }

      if (cfg.mode === "emom") {
        const nextRound = roundRef.current + 1;
        if (nextRound > cfg.emomRounds) {
          playBeep("end", mutedNow);
          setDisplaySec(0);
          setPhase("done");
          phaseRef.current = "done";
          setRunning(false);
          endAtRef.current = null;
          return;
        }
        playBeep("interval", mutedNow);
        roundRef.current = nextRound;
        setRound(nextRound);
        endAtRef.current = Date.now() + cfg.emomSec * 1000;
        setDisplaySec(cfg.emomSec);
        return;
      }

      // tabata
      if (phaseRef.current === "work") {
        playBeep("interval", mutedNow);
        phaseRef.current = "rest";
        setPhase("rest");
        endAtRef.current = Date.now() + cfg.tabataRest * 1000;
        setDisplaySec(cfg.tabataRest);
        return;
      }

      const nextRound = roundRef.current + 1;
      if (nextRound > cfg.tabataRounds) {
        playBeep("end", mutedNow);
        setDisplaySec(0);
        setPhase("done");
        phaseRef.current = "done";
        setRunning(false);
        endAtRef.current = null;
        return;
      }
      playBeep("interval", mutedNow);
      roundRef.current = nextRound;
      setRound(nextRound);
      phaseRef.current = "work";
      setPhase("work");
      endAtRef.current = Date.now() + cfg.tabataWork * 1000;
      setDisplaySec(cfg.tabataWork);
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  function start() {
    const cfg = modeConfigRef.current;
    let seconds = cfg.workMin * 60;
    if (cfg.mode === "emom") seconds = cfg.emomSec;
    if (cfg.mode === "tabata") seconds = cfg.tabataWork;

    roundRef.current = 1;
    setRound(1);
    phaseRef.current = "work";
    setPhase("work");
    endAtRef.current = Date.now() + seconds * 1000;
    setDisplaySec(seconds);
    setRunning(true);
    playBeep("start", muted);
  }

  function pause() {
    if (!running || !endAtRef.current) return;
    const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
    setDisplaySec(left);
    endAtRef.current = null;
    setRunning(false);
  }

  function resume() {
    if (running || phase === "idle" || phase === "done") return;
    endAtRef.current = Date.now() + displaySec * 1000;
    setRunning(true);
  }

  const phaseLabel =
    phase === "idle"
      ? t.phaseReady
      : phase === "done"
        ? t.phaseDone
        : phase === "rest"
          ? t.phaseRest
          : t.phaseWork;

  const modes: { id: TimerMode; label: string }[] = [
    { id: "countdown", label: t.modeCountdown },
    { id: "amrap", label: t.modeAmrap },
    { id: "emom", label: t.modeEmom },
    { id: "tabata", label: t.modeTabata },
  ];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={running}
            onClick={() => setMode(m.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              mode === m.id
                ? "bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
            } disabled:opacity-60`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!running && phase !== "done" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(mode === "countdown" || mode === "amrap") && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--color-muted)]">
                {t.minutes}
              </span>
              <Input
                type="number"
                min={1}
                max={120}
                value={workMin}
                onChange={(e) => setWorkMin(Number(e.target.value) || 1)}
              />
            </label>
          )}
          {mode === "emom" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--color-muted)]">
                  {t.intervalSec}
                </span>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={emomSec}
                  onChange={(e) => setEmomSec(Number(e.target.value) || 60)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--color-muted)]">
                  {t.rounds}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={emomRounds}
                  onChange={(e) => setEmomRounds(Number(e.target.value) || 1)}
                />
              </label>
            </>
          )}
          {mode === "tabata" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--color-muted)]">
                  {t.workSec}
                </span>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={tabataWork}
                  onChange={(e) => setTabataWork(Number(e.target.value) || 20)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--color-muted)]">
                  {t.restSec}
                </span>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={tabataRest}
                  onChange={(e) => setTabataRest(Number(e.target.value) || 10)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-[var(--color-muted)]">
                  {t.rounds}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={tabataRounds}
                  onChange={(e) =>
                    setTabataRounds(Number(e.target.value) || 8)
                  }
                />
              </label>
            </>
          )}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
          {phaseLabel}
          {(mode === "emom" || mode === "tabata") && phase !== "idle" ? (
            <span className="text-[var(--color-muted)]">
              {" "}
              · {t.roundOf
                .replace("{current}", String(round))
                .replace(
                  "{total}",
                  String(mode === "emom" ? emomRounds : tabataRounds),
                )}
            </span>
          ) : null}
        </p>
        <p className="font-title mt-4 text-6xl font-bold tabular-nums tracking-tight text-[var(--color-text)] sm:text-7xl">
          {formatClock(phase === "idle" ? idleSeconds : displaySec)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!running && (phase === "idle" || phase === "done") ? (
          <Button type="button" variant="primary" onClick={start}>
            <Play className="mr-2 h-4 w-4" aria-hidden />
            {t.start}
          </Button>
        ) : null}
        {running ? (
          <Button type="button" variant="primary" onClick={pause}>
            <Pause className="mr-2 h-4 w-4" aria-hidden />
            {t.pause}
          </Button>
        ) : null}
        {!running && phase !== "idle" && phase !== "done" ? (
          <Button type="button" variant="primary" onClick={resume}>
            <Play className="mr-2 h-4 w-4" aria-hidden />
            {t.resume}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={resetIdle}>
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
          {t.reset}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={toggleMute}
          aria-pressed={muted}
          title={muted ? t.unmute : t.mute}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" aria-hidden />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden />
          )}
          <span className="ml-2">{muted ? t.unmute : t.mute}</span>
        </Button>
      </div>
    </div>
  );
}
