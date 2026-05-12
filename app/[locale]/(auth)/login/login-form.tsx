"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({
  locale,
  banner,
}: {
  locale: Locale;
  banner?: string | null;
}) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(loginAction, null as LoginState);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {banner ? (
        <p className="rounded border border-[var(--color-muted)]/40 bg-[var(--color-surface)]/60 p-3 text-sm text-[var(--color-text)]">
          {banner}
        </p>
      ) : null}
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">{d.login.email}</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="border border-[var(--color-muted)]/40 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-muted)]">{d.login.password}</span>
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            className="border border-[var(--color-muted)]/40 bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>
        {state?.error && (
          <p className="text-sm text-[var(--color-primary)]">{d.login.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-[var(--color-primary)] px-3 py-2 font-medium text-[var(--color-text)] disabled:opacity-60"
        >
          {d.login.submit}
        </button>
      </form>
      <p className="text-sm text-[var(--color-muted)]">
        <Link href={`/${locale}/register`}>{d.login.registerLink}</Link>
      </p>
    </div>
  );
}
