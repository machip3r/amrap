"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { registerAction, type RegisterState } from "./actions";

export function RegisterForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    registerAction,
    null as RegisterState,
  );

  return (
    <>
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">{d.register.tenantName}</span>
          <input
            required
            name="tenantName"
            className="border border-[var(--color-muted)]/40 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">{d.register.fullName}</span>
          <input name="fullName" className="border border-[var(--color-muted)]/40 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">{d.register.email}</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="border border-[var(--color-muted)]/40 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">{d.register.password}</span>
          <input
            required
            name="password"
            type="password"
            autoComplete="new-password"
            className="border border-[var(--color-muted)]/40 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>
        {state?.error && (
          <p className="whitespace-pre-wrap text-sm text-[var(--color-primary)]">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-[var(--color-primary)] px-3 py-2 font-medium text-[var(--color-text)] disabled:opacity-60"
        >
          {d.register.submit}
        </button>
      </form>
      <p className="text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}/login`}>{d.register.loginLink}</Link>
      </p>
    </>
  );
}
