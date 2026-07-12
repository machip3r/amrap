"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loginAction, type LoginState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/validation/schemas";

export function LoginForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    loginAction,
    null as LoginState,
  );
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = email.trim().length > 0 && password.length > 0;
  const fe = state?.fieldErrors;

  return (
    <div className="flex w-full flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <FormField
          label={d.login.email}
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
            placeholder={d.login.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
          />
        </FormField>
        <FormField
          label={d.login.password}
          htmlFor={passwordId}
          variant="auth"
          error={fe?.password}
        >
          <PasswordInput
            id={passwordId}
            required
            name="password"
            autoComplete="current-password"
            maxLength={LIMITS.password.max}
            variant="auth"
            placeholder="••••••••"
            showLabel={d.login.showPassword}
            hideLabel={d.login.hidePassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {state?.error ? (
          <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primaryBlock"
          disabled={pending || !canSubmit}
        >
          {pending ? d.login.submitting : d.login.submit}
        </Button>
      </form>
      <div className="text-center">
        <p className="text-sm text-[var(--color-muted)]">
          {d.login.registerPrompt}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
          >
            {d.login.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
