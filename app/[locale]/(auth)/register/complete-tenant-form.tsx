"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { completeTenantAction, type RegisterState } from "./actions";

export function CompleteTenantForm({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const [state, formAction, pending] = useActionState(
    completeTenantAction,
    null as RegisterState,
  );

  return (
    <div className="w-full flex flex-col gap-5 mt-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">{d.register.tenantName}</label>
          <input
            required
            name="tenantName"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
            placeholder="My Awesome Gym"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">{d.register.fullName}</label>
          <input 
            name="fullName" 
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
            placeholder="Jane Doe"
          />
        </div>
        
        {state?.error && (
          <p className="whitespace-pre-wrap text-sm font-medium text-[var(--color-primary)] p-3 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">{state.error}</p>
        )}
        
        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-rose-600 hover:to-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {pending ? "..." : d.completeSetup.submit}
        </button>
      </form>
    </div>
  );
}
