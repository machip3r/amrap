"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Lock,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LIMITS } from "@/lib/validation/schemas";
import {
  createPlan,
  updatePlan,
  setPlanActive,
  type PlanFormState,
} from "@/app/[locale]/(app)/plans/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export type PlansPagePlan = {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  is_active: boolean;
  member_count: number;
};

export type PlansPageLabels = {
  subtitle: string;
  newPlan: string;
  planName: string;
  price: string;
  durationDays: string;
  save: string;
  cancel: string;
  close: string;
  edit: string;
  archive: string;
  restore: string;
  active: string;
  archived: string;
  noPlans: string;
  membersEnrolled: string;
  perDays: string;
  perMonth: string;
  perMonths: string;
  createTitle: string;
  createDescription: string;
  editTitle: string;
  editDescription: string;
  limitReached: string;
  limitReachedHint: string;
  upgradePlans: string;
  quotaLabel: string;
  freemium: string;
};

type Props = {
  locale: Locale;
  plans: PlansPagePlan[];
  canAdd: boolean;
  activeCount: number;
  maxPlans: number | null;
  labels: PlansPageLabels;
};

function formatPrice(price: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

function formatDuration(days: number, labels: PlansPageLabels) {
  if (days === 30) return labels.perMonth;
  if (days % 30 === 0) {
    return labels.perMonths.replace("{n}", String(days / 30));
  }
  return labels.perDays.replace("{n}", String(days));
}

function membersLabel(template: string, count: number) {
  return template.replace("{count}", String(count));
}

function PlanFormFields({
  locale,
  state,
  pending,
  submitLabel,
  cancelLabel,
  onCancel,
  defaults,
}: {
  locale: Locale;
  state: PlanFormState;
  pending: boolean;
  submitLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  defaults?: { name: string; price: number; duration_days: number };
}) {
  const d = getDictionary(locale);
  const fe = state?.fieldErrors;

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <FormField label={d.plans.planName} error={fe?.name}>
        <Input
          required
          name="name"
          maxLength={LIMITS.entityName}
          defaultValue={defaults?.name}
          autoComplete="off"
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={d.plans.price} error={fe?.price}>
          <Input
            required
            name="price"
            type="number"
            min={0}
            max={1_000_000}
            step="0.01"
            inputMode="decimal"
            defaultValue={defaults?.price}
          />
        </FormField>
        <FormField label={d.plans.durationDays} error={fe?.duration_days}>
          <Input
            required
            name="duration_days"
            type="number"
            min={1}
            max={3650}
            step={1}
            inputMode="numeric"
            defaultValue={defaults?.duration_days ?? 30}
          />
        </FormField>
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
          {pending ? d.plans.saving : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function PlansClient({
  locale,
  plans,
  canAdd,
  activeCount,
  maxPlans,
  labels,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editing, setEditing] = useState<PlansPagePlan | null>(null);

  const [createState, createAction, createPending] = useActionState(
    createPlan,
    null as PlanFormState,
  );
  const [editState, editAction, editPending] = useActionState(
    updatePlan,
    null as PlanFormState,
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

  const showLimitCard = maxPlans != null && !canAdd;

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {getDictionary(locale).plans.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {labels.subtitle}
          </p>
          {maxPlans != null ? (
            <p className="mt-2 text-xs font-medium text-[var(--color-muted)]">
              {labels.quotaLabel
                .replace("{used}", String(activeCount))
                .replace("{max}", String(maxPlans))}{" "}
              <span className="rounded-md bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[var(--color-primary)]">
                {labels.freemium}
              </span>
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="primary"
          className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm transition-[background-color,box-shadow,transform,filter] duration-200 hover:brightness-[0.92] hover:shadow-md active:translate-y-px active:brightness-[0.88] active:shadow-sm disabled:opacity-50"
          onClick={() => setCreateOpen(true)}
          disabled={!canAdd}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {labels.newPlan}
        </Button>
      </header>

      {plans.length === 0 && !showLimitCard ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-14 text-center">
          <p className="text-sm text-[var(--color-muted)]">{labels.noPlans}</p>
          <Button
            type="button"
            variant="primary"
            className="mt-4 inline-flex items-center gap-1.5 shadow-sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {labels.newPlan}
          </Button>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-[var(--color-surface)] shadow-sm transition-colors ${
                plan.is_active
                  ? "border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)]"
                  : "border-dashed border-[var(--color-border)] opacity-80"
              }`}
            >
              <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-title text-lg font-bold tracking-tight text-[var(--color-text)]">
                    {plan.name}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      plan.is_active
                        ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                        : "bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
                    }`}
                  >
                    {plan.is_active ? labels.active : labels.archived}
                  </span>
                </div>

                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
                    {formatPrice(plan.price, locale)}
                  </span>
                  <span className="text-sm text-[var(--color-muted)]">
                    {formatDuration(plan.duration_days, labels)}
                  </span>
                </p>

                <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Users className="h-4 w-4 shrink-0" aria-hidden />
                  {membersLabel(labels.membersEnrolled, plan.member_count)}
                </p>
              </div>

              <div className="flex items-center gap-1 border-t border-[var(--color-border)] px-3 py-2">
                <button
                  type="button"
                  onClick={() => setEditing(plan)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  {labels.edit}
                </button>
                <form action={setPlanActive} className="flex-1">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={plan.is_active ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                  >
                    {plan.is_active ? (
                      <>
                        <Archive className="h-3.5 w-3.5" aria-hidden />
                        {labels.archive}
                      </>
                    ) : (
                      <>
                        <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                        {labels.restore}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </article>
          ))}

          {showLimitCard ? (
            <article className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-10 text-center shadow-sm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]">
                <Lock className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
                {labels.limitReached}
              </h2>
              <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">
                {labels.limitReachedHint}
              </p>
              <Link
                href={`/${locale}/organization#subscription`}
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-[var(--color-primary-on)] shadow-sm transition-[filter] hover:brightness-[0.92]"
              >
                {labels.upgradePlans}
              </Link>
            </article>
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
        <form key={createKey} action={createAction} noValidate>
          <PlanFormFields
            locale={locale}
            state={createState}
            pending={createPending}
            submitLabel={labels.save}
            cancelLabel={labels.cancel}
            onCancel={() => setCreateOpen(false)}
          />
        </form>
      </Dialog>

      <Dialog
        open={editing != null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={labels.editTitle}
        description={labels.editDescription}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {editing ? (
          <form action={editAction} noValidate key={editing.id}>
            <input type="hidden" name="plan_id" value={editing.id} />
            <PlanFormFields
              locale={locale}
              state={editState}
              pending={editPending}
              submitLabel={labels.save}
              cancelLabel={labels.cancel}
              onCancel={() => setEditing(null)}
              defaults={{
                name: editing.name,
                price: editing.price,
                duration_days: editing.duration_days,
              }}
            />
          </form>
        ) : null}
      </Dialog>
    </>
  );
}
