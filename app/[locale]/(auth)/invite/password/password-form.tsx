"use client";

import { useActionState, useId, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import {
  LIMITS,
  sanitizePasswordInput,
} from "@/lib/validation/schemas";
import {
  setInvitePasswordAction,
  type InvitePasswordState,
} from "../actions";

type Props = {
  locale: Locale;
};

export function InvitePasswordForm({ locale }: Props) {
  const d = getDictionary(locale);
  const passwordId = useId();
  const confirmId = useId();
  const [state, formAction, pending] = useActionState(
    setInvitePasswordAction,
    null as InvitePasswordState,
  );
  const fe = state?.fieldErrors;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const canSubmit =
    password.length >= LIMITS.password.min &&
    confirm.length > 0 &&
    !pending;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormField
        label={d.invite.password}
        htmlFor={passwordId}
        variant="auth"
        error={fe?.password}
      >
        <PasswordInput
          id={passwordId}
          required
          name="password"
          autoComplete="new-password"
          maxLength={LIMITS.password.max}
          variant="auth"
          placeholder="••••••••"
          showLabel={d.login.showPassword}
          hideLabel={d.login.hidePassword}
          value={password}
          onChange={(e) => setPassword(sanitizePasswordInput(e.target.value))}
        />
      </FormField>
      <FormField
        label={d.invite.confirmPassword}
        htmlFor={confirmId}
        variant="auth"
        error={fe?.confirm}
      >
        <PasswordInput
          id={confirmId}
          required
          name="confirm"
          autoComplete="new-password"
          maxLength={LIMITS.password.max}
          variant="auth"
          placeholder="••••••••"
          showLabel={d.login.showPassword}
          hideLabel={d.login.hidePassword}
          value={confirm}
          onChange={(e) => setConfirm(sanitizePasswordInput(e.target.value))}
        />
      </FormField>
      {state?.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {pending ? d.invite.passwordSubmitting : d.invite.passwordSubmit}
      </Button>
    </form>
  );
}
