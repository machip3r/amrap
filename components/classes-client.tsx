"use client";

import { useActionState, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LIMITS } from "@/lib/validation/schemas";
import {
  createClass,
  updateClass,
  setClassActive,
  type ClassFormState,
} from "@/app/[locale]/(app)/classes/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export type ClassesPageClass = {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  is_active: boolean;
  trainerIds: string[];
  trainerNames: string[];
};

export type ClassesTrainerOption = {
  userId: string;
  name: string;
};

export type ClassesPageLabels = {
  subtitle: string;
  newClass: string;
  className: string;
  description: string;
  descriptionHint: string;
  capacity: string;
  capacityHint: string;
  trainers: string;
  trainersHint: string;
  noTrainers: string;
  save: string;
  cancel: string;
  close: string;
  edit: string;
  archive: string;
  restore: string;
  active: string;
  archived: string;
  noClasses: string;
  createTitle: string;
  createDescription: string;
  editTitle: string;
  editDescription: string;
  unlimited: string;
  trainerCount: string;
};

type Props = {
  locale: Locale;
  classes: ClassesPageClass[];
  trainers: ClassesTrainerOption[];
  labels: ClassesPageLabels;
};

function trainerCountLabel(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function ClassFormFields({
  locale,
  state,
  pending,
  submitLabel,
  cancelLabel,
  onCancel,
  trainers,
  labels,
  defaults,
}: {
  locale: Locale;
  state: ClassFormState;
  pending: boolean;
  submitLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  trainers: ClassesTrainerOption[];
  labels: ClassesPageLabels;
  defaults?: {
    name: string;
    description: string | null;
    capacity: number | null;
    trainerIds: string[];
  };
}) {
  const d = getDictionary(locale);
  const fe = state?.fieldErrors;
  const selected = new Set(defaults?.trainerIds ?? []);

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <FormField label={labels.className} variant="auth" error={fe?.name}>
        <Input
          required
          name="name"
          variant="auth"
          maxLength={LIMITS.entityName}
          defaultValue={defaults?.name}
          autoComplete="off"
        />
      </FormField>
      <FormField
        label={labels.description}
        variant="auth"
        hint={labels.descriptionHint}
        error={fe?.description}
      >
        <Input
          name="description"
          variant="auth"
          maxLength={LIMITS.message}
          defaultValue={defaults?.description ?? ""}
        />
      </FormField>
      <FormField
        label={labels.capacity}
        variant="auth"
        hint={labels.capacityHint}
        error={fe?.capacity}
      >
        <Input
          name="capacity"
          type="number"
          min={1}
          max={10_000}
          step={1}
          inputMode="numeric"
          variant="auth"
          placeholder={labels.unlimited}
          defaultValue={defaults?.capacity ?? ""}
        />
      </FormField>
      <div>
        <p className="mb-1.5 text-sm font-medium text-[var(--color-text)]">
          {labels.trainers}
        </p>
        <p className="mb-2 text-xs text-[var(--color-muted)]">
          {labels.trainersHint}
        </p>
        {trainers.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{labels.noTrainers}</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2">
            {trainers.map((t) => (
              <li key={t.userId}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]">
                  <input
                    type="checkbox"
                    name="trainer_ids"
                    value={t.userId}
                    defaultChecked={selected.has(t.userId)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
                  />
                  <span className="truncate">{t.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {fe?.trainer_ids ? (
          <p
            className="mt-1.5 text-sm font-medium text-[var(--color-primary)]"
            role="alert"
          >
            {fe.trainer_ids}
          </p>
        ) : null}
      </div>
      {state?.error ? (
        <p
          className="text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold"
          onClick={onCancel}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="mt-0 shadow-sm"
          disabled={pending}
        >
          {pending ? d.classes.saving : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function ClassesClient({ locale, classes, trainers, labels }: Props) {
  const d = getDictionary(locale);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editing, setEditing] = useState<ClassesPageClass | null>(null);
  const [archiving, setArchiving] = useState<ClassesPageClass | null>(null);

  const [createState, createAction, createPending] = useActionState(
    createClass,
    null as ClassFormState,
  );
  const [editState, editAction, editPending] = useActionState(
    updateClass,
    null as ClassFormState,
  );

  const [prevCreateState, setPrevCreateState] = useState(createState);
  if (createState !== prevCreateState) {
    setPrevCreateState(createState);
    if (createState?.success) {
      setCreateOpen(false);
      setCreateKey((k) => k + 1);
    }
  }

  const [prevEditState, setPrevEditState] = useState(editState);
  if (editState !== prevEditState) {
    setPrevEditState(editState);
    if (editState?.success) setEditing(null);
  }

  const active = classes.filter((c) => c.is_active);
  const archived = classes.filter((c) => !c.is_active);

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {d.classes.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {labels.subtitle}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {labels.newClass}
        </Button>
      </header>

      {classes.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-14 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-sm text-[var(--color-muted)]">{labels.noClasses}</p>
          <Button
            type="button"
            variant="primary"
            className="mt-4 inline-flex items-center gap-1.5 shadow-sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {labels.newClass}
          </Button>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-title text-xl font-bold text-[var(--color-text)]">
                      {c.name}
                    </h2>
                    <span className="rounded-md bg-[var(--color-success)]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                      {labels.active}
                    </span>
                  </div>
                  {c.description ? (
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {c.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {c.capacity != null
                        ? String(c.capacity)
                        : labels.unlimited}
                    </span>
                    <span>
                      {trainerCountLabel(
                        labels.trainerCount,
                        c.trainerIds.length,
                      )}
                      {c.trainerNames.length > 0
                        ? `: ${c.trainerNames.join(", ")}`
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                    aria-label={labels.edit}
                    title={labels.edit}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiving(c)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                    aria-label={labels.archive}
                    title={labels.archive}
                  >
                    <Archive className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {archived.length > 0 ? (
            <div className="mt-2 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {labels.archived}
              </h3>
              {archived.map((c) => (
                <article
                  key={c.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
                          {c.name}
                        </h2>
                        <span className="rounded-md bg-[var(--color-muted)]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          {labels.archived}
                        </span>
                      </div>
                      {c.trainerNames.length > 0 ? (
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {c.trainerNames.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <form action={setClassActive}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="class_id" value={c.id} />
                      <input type="hidden" name="is_active" value="true" />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                      >
                        <ArchiveRestore className="h-4 w-4" aria-hidden />
                        {labels.restore}
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={labels.createTitle}
        description={labels.createDescription}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {createOpen ? (
          <form action={createAction} key={createKey} noValidate>
            <ClassFormFields
              locale={locale}
              state={createState}
              pending={createPending}
              submitLabel={labels.save}
              cancelLabel={labels.cancel}
              onCancel={() => setCreateOpen(false)}
              trainers={trainers}
              labels={labels}
            />
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={labels.editTitle}
        description={labels.editDescription}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {editing ? (
          <form action={editAction} key={editing.id} noValidate>
            <input type="hidden" name="class_id" value={editing.id} />
            <ClassFormFields
              locale={locale}
              state={editState}
              pending={editPending}
              submitLabel={labels.save}
              cancelLabel={labels.cancel}
              onCancel={() => setEditing(null)}
              trainers={trainers}
              labels={labels}
              defaults={{
                name: editing.name,
                description: editing.description,
                capacity: editing.capacity,
                trainerIds: editing.trainerIds,
              }}
            />
          </form>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={archiving != null}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title={labels.archive}
        description={
          archiving ? `${labels.archive}: ${archiving.name}` : undefined
        }
        closeLabel={labels.close}
        cancelLabel={labels.cancel}
        confirmLabel={labels.archive}
        action={setClassActive}
      >
        {archiving ? (
          <>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="class_id" value={archiving.id} />
            <input type="hidden" name="is_active" value="false" />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
