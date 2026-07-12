"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPlan, type CreatePlanState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/validation/schemas";

/** Compact form used by onboarding; plans page uses PlansClient dialogs. */
export function CreatePlanForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    createPlan,
    null as CreatePlanState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state?.fieldErrors;

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 text-sm"
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <FormField label={d.plans.planName} error={fe?.name}>
        <Input required name="name" maxLength={LIMITS.entityName} />
      </FormField>
      <FormField label={d.plans.price} error={fe?.price}>
        <Input
          required
          name="price"
          type="number"
          min={0}
          max={1_000_000}
          step="0.01"
          inputMode="decimal"
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
          defaultValue={30}
          inputMode="numeric"
        />
      </FormField>
      {state?.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="appPrimary" disabled={pending}>
        {pending ? d.plans.saving : d.plans.save}
      </Button>
    </form>
  );
}
