"use client";

import { useActionState, useId } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { OnboardingState } from "@/lib/auth/session";
import {
  addOnboardingPlanAction,
  finishOnboardingAction,
  saveOnboardingGymAction,
  saveOnboardingProfileAction,
  skipOnboardingPlansAction,
  type OnboardingActionState,
} from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/validation/schemas";

type PlanRow = { id: string; name: string; price: number; duration_days: number };

type Props = {
  locale: Locale;
  state: OnboardingState;
  plans: PlanRow[];
  showError?: boolean;
};

export function OnboardingStepper({ locale, state, plans, showError }: Props) {
  const d = getDictionary(locale);
  const step = state.step;

  return (
    <div className="flex w-full flex-col gap-8">
      <nav aria-label={d.onboarding.stepsLabel} className="flex gap-2">
        {([1, 2, 3, 4] as const).map((n) => {
          const active = step === n;
          const done = step > n;
          return (
            <div
              key={n}
              className={`flex flex-1 flex-col gap-1 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-40"}`}
            >
              <div
                className={`h-1 rounded-full ${
                  active || done
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-muted)]/30"
                }`}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {n === 1
                  ? d.onboarding.stepYou
                  : n === 2
                    ? d.onboarding.stepGym
                    : n === 3
                      ? d.onboarding.stepPlans
                      : d.onboarding.stepDone}
              </span>
            </div>
          );
        })}
      </nav>

      {showError ? (
        <p className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]">
          {d.onboarding.errorSave}
        </p>
      ) : null}

      {step === 1 ? <StepProfile locale={locale} state={state} /> : null}
      {step === 2 ? <StepGym locale={locale} state={state} /> : null}
      {step === 3 ? (
        <StepPlans locale={locale} state={state} plans={plans} />
      ) : null}
      {step === 4 ? <StepDone locale={locale} state={state} /> : null}
    </div>
  );
}

function StepProfile({
  locale,
  state,
}: {
  locale: Locale;
  state: OnboardingState;
}) {
  const d = getDictionary(locale);
  const [formState, formAction, pending] = useActionState(
    saveOnboardingProfileAction,
    null as OnboardingActionState,
  );
  const nameId = useId();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          {d.onboarding.profileTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.onboarding.profileSubtitle}
        </p>
        {state.organizationName ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {d.onboarding.orgLabel}:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {state.organizationName}
            </span>
          </p>
        ) : null}
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <FormField
          label={d.onboarding.fullName}
          htmlFor={nameId}
          variant="auth"
          error={formState?.fieldErrors?.fullName}
        >
          <Input
            id={nameId}
            required
            name="fullName"
            variant="auth"
            defaultValue={state.fullName ?? ""}
            placeholder={d.onboarding.fullNamePlaceholder}
            autoComplete="name"
            maxLength={LIMITS.personName}
          />
        </FormField>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-[var(--color-text)]">
            {d.onboarding.roleLegend}
          </legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-surface-hover)]">
            <input
              type="radio"
              name="roleIntent"
              value="owner"
              defaultChecked={!state.pendingAsProvisional}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-text)]">
                {d.onboarding.roleOwner}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {d.onboarding.roleOwnerHint}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-surface-hover)]">
            <input
              type="radio"
              name="roleIntent"
              value="manager"
              defaultChecked={state.pendingAsProvisional}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-text)]">
                {d.onboarding.roleManager}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {d.onboarding.roleManagerHint}
              </span>
            </span>
          </label>
        </fieldset>

        {formState?.error ? (
          <p className="text-sm font-medium text-[var(--color-primary)]">
            {formState.error}
          </p>
        ) : null}

        <Button type="submit" variant="primaryBlock" disabled={pending}>
          {pending ? d.onboarding.saving : d.onboarding.continue}
        </Button>
      </form>
    </section>
  );
}

function StepGym({
  locale,
  state,
}: {
  locale: Locale;
  state: OnboardingState;
}) {
  const d = getDictionary(locale);
  const [formState, formAction, pending] = useActionState(
    saveOnboardingGymAction,
    null as OnboardingActionState,
  );
  const gymId = useId();
  const branchId = useId();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          {d.onboarding.gymTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.onboarding.gymSubtitle}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <FormField
          label={d.onboarding.gymName}
          htmlFor={gymId}
          variant="auth"
          error={formState?.fieldErrors?.gymName}
        >
          <Input
            id={gymId}
            required
            name="gymName"
            variant="auth"
            defaultValue={state.gymName ?? state.organizationName ?? ""}
            placeholder={d.onboarding.gymNamePlaceholder}
            maxLength={LIMITS.entityName}
          />
        </FormField>
        <FormField
          label={d.onboarding.branchName}
          htmlFor={branchId}
          variant="auth"
          error={formState?.fieldErrors?.branchName}
        >
          <Input
            id={branchId}
            name="branchName"
            variant="auth"
            placeholder={d.onboarding.branchNamePlaceholder}
            maxLength={LIMITS.entityName}
          />
        </FormField>

        {formState?.error ? (
          <p className="text-sm font-medium text-[var(--color-primary)]">
            {formState.error}
          </p>
        ) : null}

        <Button type="submit" variant="primaryBlock" disabled={pending}>
          {pending ? d.onboarding.saving : d.onboarding.continue}
        </Button>
      </form>
    </section>
  );
}

function StepPlans({
  locale,
  state,
  plans,
}: {
  locale: Locale;
  state: OnboardingState;
  plans: PlanRow[];
}) {
  const d = getDictionary(locale);
  const [formState, formAction, pending] = useActionState(
    addOnboardingPlanAction,
    null as OnboardingActionState,
  );
  const nameId = useId();
  const priceId = useId();
  const daysId = useId();
  const atLimit = plans.length >= 2;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          {d.onboarding.plansTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {d.onboarding.plansSubtitle}
        </p>
        {state.gymName ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {d.onboarding.gymLabel}:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {state.gymName}
            </span>
          </p>
        ) : null}
      </div>

      {plans.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {plans.map((p) => (
            <li
              key={p.id}
              className="flex justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
            >
              <span className="font-medium text-[var(--color-text)]">{p.name}</span>
              <span className="text-[var(--color-muted)]">
                ${p.price} · {p.duration_days}d
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {!atLimit ? (
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <FormField
            label={d.plans.planName}
            htmlFor={nameId}
            variant="auth"
            error={formState?.fieldErrors?.name}
          >
            <Input
              id={nameId}
              required
              name="name"
              variant="auth"
              maxLength={LIMITS.entityName}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={d.plans.price}
              htmlFor={priceId}
              variant="auth"
              error={formState?.fieldErrors?.price}
            >
              <Input
                id={priceId}
                required
                name="price"
                type="number"
                min={0}
                max={1_000_000}
                step="0.01"
                inputMode="decimal"
                variant="auth"
              />
            </FormField>
            <FormField
              label={d.plans.durationDays}
              htmlFor={daysId}
              variant="auth"
              error={formState?.fieldErrors?.duration_days}
            >
              <Input
                id={daysId}
                required
                name="duration_days"
                type="number"
                min={1}
                max={3650}
                step={1}
                defaultValue={30}
                inputMode="numeric"
                variant="auth"
              />
            </FormField>
          </div>
          {formState?.error ? (
            <p className="text-sm font-medium text-[var(--color-primary)]">
              {formState.error}
            </p>
          ) : null}
          <Button type="submit" variant="primaryBlock" disabled={pending}>
            {pending ? d.onboarding.saving : d.onboarding.addPlan}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">{d.onboarding.planLimit}</p>
      )}

      <form action={skipOnboardingPlansAction}>
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="ghost" className="w-full py-2 text-sm">
          {plans.length > 0 ? d.onboarding.continue : d.onboarding.skipPlans}
        </Button>
      </form>
    </section>
  );
}

function StepDone({
  locale,
  state,
}: {
  locale: Locale;
  state: OnboardingState;
}) {
  const d = getDictionary(locale);

  return (
    <section className="flex flex-col gap-4 text-center">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          {d.onboarding.doneTitle}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {d.onboarding.doneSubtitle}
        </p>
      </div>
      <dl className="space-y-2 rounded-lg border border-[var(--color-border)] p-4 text-left text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-muted)]">{d.onboarding.orgLabel}</dt>
          <dd className="font-medium text-[var(--color-text)]">
            {state.organizationName}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--color-muted)]">{d.onboarding.gymLabel}</dt>
          <dd className="font-medium text-[var(--color-text)]">{state.gymName}</dd>
        </div>
      </dl>
      <form action={finishOnboardingAction}>
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="primaryBlock">
          {d.onboarding.goDashboard}
        </Button>
      </form>
    </section>
  );
}
