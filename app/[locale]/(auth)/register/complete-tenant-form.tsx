"use client";

import { useActionState, useId } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { completeTenantAction, type RegisterState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CompleteTenantForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    completeTenantAction,
    null as RegisterState,
  );
  const tenantId = useId();
  const nameId = useId();

  return (
    <div className="mt-4 flex w-full flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />

        <FormField label={d.register.tenantName} htmlFor={tenantId} variant="auth">
          <Input
            id={tenantId}
            required
            name="tenantName"
            variant="auth"
            placeholder={d.register.tenantNamePlaceholder}
          />
        </FormField>

        <FormField label={d.register.fullName} htmlFor={nameId} variant="auth">
          <Input
            id={nameId}
            name="fullName"
            variant="auth"
            placeholder={d.register.fullNamePlaceholder}
          />
        </FormField>

        {state?.error && (
          <p className="whitespace-pre-wrap rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primaryBlock" disabled={pending}>
          {pending ? d.common.loading : d.completeSetup.submit}
        </Button>
      </form>
    </div>
  );
}
