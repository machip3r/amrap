"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createPayment, type CreatePaymentState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type MemberOption = { id: string; name: string };

type Props = {
  locale: Locale;
  members: MemberOption[];
};

export function CreatePaymentForm({ locale, members }: Props) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    createPayment,
    null as CreatePaymentState,
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
      <FormField label={d.payments.member} error={fe?.member_id}>
        <Select required name="member_id" defaultValue={members[0]?.id}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label={d.payments.amount} error={fe?.amount}>
        <Input
          required
          name="amount"
          type="number"
          min={0}
          max={1_000_000}
          step="0.01"
          inputMode="decimal"
        />
      </FormField>
      <FormField label={d.payments.method} error={fe?.method}>
        <Select name="method" defaultValue="cash">
          <option value="cash">{d.members.cash}</option>
          <option value="transfer">{d.members.transfer}</option>
        </Select>
      </FormField>
      {state?.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="appPrimary" disabled={pending}>
        {d.payments.submit}
      </Button>
    </form>
  );
}
