"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { registerAction, type RegisterState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/validation/schemas";

export function RegisterForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    registerAction,
    null as RegisterState,
  );
  const orgId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const canSubmit =
    organizationName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;
  const fe = state?.fieldErrors;

  return (
    <div className="flex w-full flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />

        <FormField
          label={d.register.organizationName}
          htmlFor={orgId}
          variant="auth"
          error={fe?.organizationName}
        >
          <Input
            id={orgId}
            required
            name="organizationName"
            variant="auth"
            placeholder={d.register.organizationNamePlaceholder}
            autoComplete="organization"
            maxLength={LIMITS.entityName}
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
        </FormField>

        <FormField
          label={d.register.email}
          htmlFor={emailId}
          variant="auth"
          error={fe?.email}
        >
          <Input
            id={emailId}
            required
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            maxLength={LIMITS.email}
            variant="auth"
            placeholder={d.register.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
          />
        </FormField>

        <FormField
          label={d.register.password}
          htmlFor={passwordId}
          variant="auth"
          error={fe?.password}
        >
          <PasswordInput
            id={passwordId}
            required
            name="password"
            autoComplete="new-password"
            minLength={LIMITS.password.min}
            maxLength={LIMITS.password.max}
            variant="auth"
            placeholder="••••••••"
            showLabel={d.register.showPassword}
            hideLabel={d.register.hidePassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>

        <FormField
          label={d.register.confirmPassword}
          htmlFor={confirmId}
          variant="auth"
          error={fe?.confirmPassword}
        >
          <PasswordInput
            id={confirmId}
            required
            name="confirmPassword"
            autoComplete="new-password"
            minLength={LIMITS.password.min}
            maxLength={LIMITS.password.max}
            variant="auth"
            placeholder="••••••••"
            showLabel={d.register.showPassword}
            hideLabel={d.register.hidePassword}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormField>

        {state?.error ? (
          <p
            className="whitespace-pre-wrap rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primaryBlock"
          disabled={pending || !canSubmit}
        >
          {pending ? d.register.submitting : d.register.submit}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-[var(--color-muted)]">
          {d.register.loginPrompt}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-semibold text-[var(--color-text)] transition-colors duration-200 hover:text-[var(--color-primary)]"
          >
            {d.register.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
