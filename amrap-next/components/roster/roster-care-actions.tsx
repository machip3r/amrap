"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Cake, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertSessionResult } from "@/app/[locale]/(app)/classes/actions";
import type { SessionRosterResult } from "@/lib/classes/queries";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Labels = Dictionary["roster"] & { close: string };

type CareBadgesProps = {
  medicalNote: string | null;
  isFirstDay: boolean;
  isBirthday: boolean;
  labels: Labels;
};

export function RosterCareBadges({
  medicalNote,
  isFirstDay,
  isBirthday,
  labels,
}: CareBadgesProps) {
  const [medicalOpen, setMedicalOpen] = useState(false);
  const hasMedical = Boolean(medicalNote?.trim());

  if (!hasMedical && !isFirstDay && !isBirthday) return null;

  return (
    <>
      <span className="inline-flex items-center gap-1">
        {hasMedical ? (
          <button
            type="button"
            onClick={() => setMedicalOpen(true)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-700 hover:bg-amber-500/15"
            title={labels.medical}
            aria-label={labels.medical}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        {isFirstDay ? (
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-primary)]"
            title={labels.firstDay}
            aria-label={labels.firstDay}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        {isBirthday ? (
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-600"
            title={labels.birthday}
            aria-label={labels.birthday}
          >
            <Cake className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </span>
      <Dialog
        open={medicalOpen}
        onOpenChange={setMedicalOpen}
        title={labels.medical}
        closeLabel={labels.close}
      >
        <p className="whitespace-pre-wrap text-sm text-[var(--color-text)]">
          {medicalNote?.trim() || labels.noMedicalNote}
        </p>
      </Dialog>
    </>
  );
}

type ResultButtonProps = {
  locale: string;
  sessionId: string;
  personId: string;
  personName: string;
  existing: SessionRosterResult | null;
  labels: Labels;
};

export function RosterResultButton({
  locale,
  sessionId,
  personId,
  personName,
  existing,
  labels,
}: ResultButtonProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"amrap" | "strength" | "for_time">(
    existing?.kind === "strength" || existing?.kind === "for_time"
      ? existing.kind
      : "amrap",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const existingMins =
    existing?.time_seconds != null
      ? Math.floor(existing.time_seconds / 60)
      : "";
  const existingSecs =
    existing?.time_seconds != null ? existing.time_seconds % 60 : "";

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertSessionResult(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
      >
        {labels.recordResult}
        {existing ? " ✓" : ""}
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`${labels.resultTitle} · ${personName}`}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="person_id" value={personId} />
          <input type="hidden" name="kind" value={kind} />

          <div className="flex flex-wrap gap-1">
            {(
              [
                ["amrap", labels.kindAmrap],
                ["strength", labels.kindStrength],
                ["for_time", labels.kindForTime],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  kind === k
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                    : "border border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === "amrap" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
                {labels.rounds}
                <Input
                  name="rounds"
                  type="number"
                  min={0}
                  defaultValue={existing?.rounds ?? ""}
                  variant="auth"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
                {labels.reps}
                <Input
                  name="reps"
                  type="number"
                  min={0}
                  defaultValue={existing?.reps ?? ""}
                  variant="auth"
                />
              </label>
            </div>
          ) : null}

          {kind === "strength" ? (
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
              {labels.weightKg}
              <Input
                name="weight_kg"
                type="number"
                min={0}
                step="0.5"
                defaultValue={existing?.weight_kg ?? ""}
                variant="auth"
              />
            </label>
          ) : null}

          {kind === "for_time" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
                {labels.minutes}
                <Input
                  name="time_minutes"
                  type="number"
                  min={0}
                  defaultValue={existingMins}
                  variant="auth"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
                {labels.seconds}
                <Input
                  name="time_seconds_part"
                  type="number"
                  min={0}
                  max={59}
                  defaultValue={existingSecs}
                  variant="auth"
                />
              </label>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          ) : null}

          <Button type="submit" variant="primary" disabled={pending}>
            {labels.saveResult}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
