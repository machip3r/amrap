"use client";

import { useActionState, useId, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createMember, type CreateMemberState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LIMITS, sanitizeEmailInput, sanitizePersonNameInput } from "@/lib/validation/schemas";
import type { RegisterPlanOption } from "@/components/register-user-dialog";

type Props = {
  locale: Locale;
  plans: RegisterPlanOption[];
};

function formatPlanLabel(plan: RegisterPlanOption, template: string): string {
  const price =
    typeof plan.price === "number"
      ? plan.price.toFixed(2)
      : String(plan.price);
  const meta = template
    .replace("{days}", String(plan.duration_days))
    .replace("{price}", price);
  return `${plan.name} — ${meta}`;
}

type FieldsProps = {
  locale: Locale;
  plans: RegisterPlanOption[];
  formAction: (payload: FormData) => void;
  state: CreateMemberState;
  pending: boolean;
};

function CreateMemberFields({
  locale,
  plans,
  formAction,
  state,
  pending,
}: FieldsProps) {
  const d = getDictionary(locale);
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const planFieldId = useId();
  const methodId = useId();
  const fe = state?.fieldErrors;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [method, setMethod] = useState("cash");

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    planId.length > 0 &&
    plans.length > 0 &&
    !pending;

  return (
    <form action={formAction} className="flex flex-col gap-4 text-sm" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormField
        label={d.members.name}
        htmlFor={nameId}
        variant="auth"
        error={fe?.name}
      >
        <Input
          id={nameId}
          required
          name="name"
          variant="auth"
          maxLength={LIMITS.personName}
          autoComplete="name"
          placeholder={d.registerUser.namePlaceholder}
          value={name}
          onChange={(e) => setName(sanitizePersonNameInput(e.target.value))}
        />
      </FormField>
      <FormField
        label={d.registerUser.email}
        htmlFor={emailId}
        variant="auth"
        error={fe?.email}
      >
        <Input
          id={emailId}
          required
          type="email"
          name="email"
          variant="auth"
          maxLength={LIMITS.email}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          placeholder={d.registerUser.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
        />
      </FormField>
      <FormField
        label={d.members.phone}
        htmlFor={phoneId}
        variant="auth"
        error={fe?.phone}
      >
        <PhoneInput
          id={phoneId}
          name="phone"
          locale={locale}
          variant="auth"
          countryLabel={d.registerUser.countryCode}
          placeholder={d.registerUser.phonePlaceholder}
          value={phone}
          onChange={setPhone}
        />
      </FormField>
      <FormField
        label={d.members.selectPlan}
        htmlFor={planFieldId}
        variant="auth"
        error={fe?.plan_id}
      >
        <Select
          id={planFieldId}
          required
          name="plan_id"
          variant="auth"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {formatPlanLabel(p, d.registerUser.planPrice)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label={d.members.paymentMethod}
        htmlFor={methodId}
        variant="auth"
        error={fe?.method}
      >
        <Select
          id={methodId}
          name="method"
          variant="auth"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="cash">{d.members.cash}</option>
          <option value="transfer">{d.members.transfer}</option>
        </Select>
      </FormField>
      {state?.error ? (
        <p
          className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primaryBlock" disabled={!canSubmit}>
        {pending ? d.registerUser.submitting : d.members.save}
      </Button>
    </form>
  );
}

export function CreateMemberForm({ locale, plans }: Props) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    createMember,
    null as CreateMemberState,
  );
  const [epoch, setEpoch] = useState(0);
  const [handledSuccess, setHandledSuccess] = useState<CreateMemberState>(null);

  if (state?.success && state !== handledSuccess) {
    setHandledSuccess(state);
    setEpoch((e) => e + 1);
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {d.registerUser.noPlans}
      </p>
    );
  }

  return (
    <CreateMemberFields
      key={epoch}
      locale={locale}
      plans={plans}
      formAction={formAction}
      state={state?.success ? null : state}
      pending={pending}
    />
  );
}
