"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loginAction, type LoginState } from "./actions";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({
  locale,
  banner,
}: {
  locale: Locale;
  banner?: string | null;
}) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(loginAction, null as LoginState);
  const emailId = useId();
  const passwordId = useId();

  return (
    <div className="flex w-full flex-col gap-5">
      {banner ? (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-text)]">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{banner}</p>
        </div>
      ) : null}
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <FormField label={d.login.email} htmlFor={emailId} variant="auth">
          <Input
            id={emailId}
            required
            name="email"
            type="email"
            autoComplete="email"
            variant="auth"
            placeholder={d.login.emailPlaceholder}
          />
        </FormField>
        <FormField label={d.login.password} htmlFor={passwordId} variant="auth">
          <Input
            id={passwordId}
            required
            name="password"
            type="password"
            autoComplete="current-password"
            variant="auth"
            placeholder="••••••••"
          />
        </FormField>
        {state?.error && (
          <p className="text-sm font-medium text-[var(--color-primary)]">{d.login.error}</p>
        )}
        <Button type="submit" variant="primaryBlock" disabled={pending}>
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
