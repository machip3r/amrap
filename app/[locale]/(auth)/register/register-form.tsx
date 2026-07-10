"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { registerAction, type RegisterState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

export function RegisterForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    registerAction,
    null as RegisterState,
  );
  const tenantId = useId();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  return (
    <div className="flex w-full flex-col gap-5">
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

        <FormField label={d.register.email} htmlFor={emailId} variant="auth">
          <Input
            id={emailId}
            required
            name="email"
            type="email"
            autoComplete="email"
            variant="auth"
            placeholder={d.register.emailPlaceholder}
          />
        </FormField>

        <FormField label={d.register.password} htmlFor={passwordId} variant="auth">
          <PasswordInput
            id={passwordId}
            required
            name="password"
            autoComplete="new-password"
            variant="auth"
            placeholder="••••••••"
            showLabel={d.register.showPassword}
            hideLabel={d.register.hidePassword}
          />
        </FormField>

        <FormField label={d.register.confirmPassword} htmlFor={confirmId} variant="auth">
          <PasswordInput
            id={confirmId}
            required
            name="confirmPassword"
            autoComplete="new-password"
            variant="auth"
            placeholder="••••••••"
            showLabel={d.register.showPassword}
            hideLabel={d.register.hidePassword}
          />
        </FormField>

        {state?.error && (
          <p className="whitespace-pre-wrap rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primaryBlock" disabled={pending}>
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
