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

export function playBeep(
  kind: "start" | "interval" | "rest" | "end",
  muted: boolean,
) {
  if (muted || typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    master.gain.value = 0.75;
    master.connect(compressor);
    compressor.connect(ctx.destination);
    const now = ctx.currentTime;

    // Layered, fast-decaying harmonics create a clear metallic "tin".
    const strike = (at: number, strength: number) => {
      const partials = [
        { ratio: 1, gain: 0.34 },
        { ratio: 1.51, gain: 0.2 },
        { ratio: 2.43, gain: 0.1 },
      ];
      for (const partial of partials) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1_250 * partial.ratio, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(
          partial.gain * strength,
          at + 0.008,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.72);
        osc.connect(gain);
        gain.connect(master);
        osc.start(at);
        osc.stop(at + 0.75);
      }
    };

    if (kind === "start" || kind === "end") {
      strike(now, 1);
      strike(now + 0.38, 0.95);
    } else if (kind === "rest") {
      strike(now, 1);
    } else {
      strike(now, 0.7);
    }

    window.setTimeout(() => void ctx.close(), 1_400);
  } catch {
    /* ignore */
  }
}
