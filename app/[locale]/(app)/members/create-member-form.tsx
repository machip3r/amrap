"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createMember, type CreateMemberState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/validation/schemas";

type Props = {
  locale: Locale;
  defaultExpires: string;
};

export function CreateMemberForm({ locale, defaultExpires }: Props) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    createMember,
    null as CreateMemberState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state?.fieldErrors;

  useEffect(() => {
    if (state === null) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 text-sm"
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <FormField label={d.members.name} error={fe?.name}>
        <Input required name="name" maxLength={LIMITS.personName} autoComplete="name" />
      </FormField>
      <FormField label={d.members.phone} error={fe?.phone}>
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          maxLength={LIMITS.phone}
          autoComplete="tel"
        />
      </FormField>
      <FormField
        label={d.members.membershipExpires}
        error={fe?.membership_expires_at}
      >
        <Input
          required
          type="datetime-local"
          name="membership_expires_at"
          maxLength={32}
          defaultValue={defaultExpires}
        />
      </FormField>
      {state?.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="appPrimary" disabled={pending}>
        {d.members.save}
      </Button>
    </form>
  );
}
