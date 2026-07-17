import {
  newId,
  type TimerPhase,
  type TimerRoutine,
} from "@/lib/timers/types";

export type TemplateId =
  | "countdown"
  | "amrap"
  | "emom"
  | "tabata"
  | "hiit";

function phase(
  kind: TimerPhase["kind"],
  label: string,
  seconds: number,
): TimerPhase {
  return { id: newId(), kind, label, seconds };
}

function simpleRoutine(
  partial: Omit<TimerRoutine, "id" | "updatedAt" | "type"> & {
    phases: TimerPhase[];
    repeatSets?: number;
  },
): TimerRoutine {
  return {
    id: newId(),
    type: "simple",
    updatedAt: Date.now(),
    ...partial,
  };
}

/** Factory for seeded / template-applied routines (fresh ids each call). */
export function createFromTemplate(templateId: TemplateId): TimerRoutine {
  switch (templateId) {
    case "countdown":
      return simpleRoutine({
        name: "Countdown",
        color: "#2563eb",
        templateId,
        phases: [
          phase("warmup", "Warm Up", 0),
          phase("work", "Countdown", 300),
          phase("rest", "Rest", 0),
          phase("cooldown", "Cool Down", 0),
        ],
        repeatSets: 1,
      });
    case "amrap":
      return simpleRoutine({
        name: "AMRAP",
        color: "#e11d48",
        templateId,
        phases: [
          phase("warmup", "Warm Up", 0),
          phase("work", "AMRAP", 600),
          phase("rest", "Rest", 0),
          phase("cooldown", "Cool Down", 0),
        ],
        repeatSets: 1,
      });
    case "emom":
      return simpleRoutine({
        name: "EMOM",
        color: "#0d9488",
        templateId,
        phases: [
          phase("warmup", "Warm Up", 0),
          phase("work", "Work", 60),
          phase("rest", "Rest", 0),
          phase("cooldown", "Cool Down", 0),
        ],
        repeatSets: 10,
      });
    case "tabata":
      return simpleRoutine({
        name: "Tabata",
        color: "#d97706",
        templateId,
        phases: [
          phase("warmup", "Warm Up", 0),
          phase("work", "High Intensity", 20),
          phase("rest", "Low Intensity", 10),
          phase("cooldown", "Cool Down", 0),
        ],
        repeatSets: 8,
      });
    case "hiit":
    default:
      return simpleRoutine({
        name: "HIIT",
        color: "#e11d48",
        templateId: "hiit",
        phases: [
          phase("warmup", "Warm Up", 0),
          phase("work", "High Intensity", 20),
          phase("rest", "Low Intensity", 10),
          phase("cooldown", "Cool Down", 0),
        ],
        repeatSets: 1,
      });
  }
}

export function blankSimpleRoutine(): TimerRoutine {
  return createFromTemplate("hiit");
}

export function blankComplexRoutine(): TimerRoutine {
  return {
    id: newId(),
    name: "Complex",
    color: "#7c3aed",
    type: "complex",
    templateId: undefined,
    warmupSeconds: 0,
    cooldownSeconds: 0,
    cycles: [
      {
        id: newId(),
        sets: 1,
        phases: [
          phase("work", "High Intensity", 20),
          phase("rest", "Low Intensity", 10),
        ],
      },
    ],
    updatedAt: Date.now(),
  };
}

export const TEMPLATE_OPTIONS: {
  id: TemplateId;
  nameKey:
    | "tplCountdown"
    | "tplAmrap"
    | "tplEmom"
    | "tplTabata"
    | "tplHiit";
}[] = [
  { id: "countdown", nameKey: "tplCountdown" },
  { id: "amrap", nameKey: "tplAmrap" },
  { id: "emom", nameKey: "tplEmom" },
  { id: "tabata", nameKey: "tplTabata" },
  { id: "hiit", nameKey: "tplHiit" },
];

/** Seed list when storage is empty. */
export function seedRoutines(): TimerRoutine[] {
  return (
    ["hiit", "amrap", "emom", "tabata", "countdown"] as TemplateId[]
  ).map((id) => createFromTemplate(id));
}
