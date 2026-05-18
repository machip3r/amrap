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
    <div className="flex w-full flex-col gap-5">
      {banner ? (
        <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-text)] flex items-start gap-3">
          <svg className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p>{banner}</p>
        </div>
      ) : null}
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">{d.login.email}</label>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--color-text)]">{d.login.password}</label>
          </div>
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
            placeholder="••••••••"
          />
        </div>
        {state?.error && (
          <p className="text-sm font-medium text-[var(--color-primary)]">{d.login.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-rose-600 hover:to-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {pending ? "..." : d.login.submit}
        </button>
      </form>
      <div className="text-center">
        <p className="text-sm text-[var(--color-muted)]">
          {d.login.registerLink ? "Don't have an account? " : ""}
          <Link href={`/${locale}/register`} className="font-semibold text-[var(--color-text)] hover:text-white transition-colors">
            {d.login.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
