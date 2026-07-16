"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import {
  getCustomizableOpsNavItems,
  roleAllowsNavCustomization,
  type OpsNavContext,
  type OpsNavId,
} from "@/lib/nav/ops-nav";
import {
  saveNavVisibilityAction,
  type SettingsActionState,
} from "./actions";

type Props = {
  locale: Locale;
  role: Role;
  canManageSettings: boolean;
  canManageStaff: boolean;
  hiddenNavIds: readonly string[];
};

export function NavCustomizationForm({
  locale,
  role,
  canManageSettings,
  canManageStaff,
  hiddenNavIds,
}: Props) {
  const d = getDictionary(locale);
  const [state, action, pending] = useActionState(
    saveNavVisibilityAction,
    null as SettingsActionState,
  );
  const [hidden, setHidden] = useState(() => new Set(hiddenNavIds));
  const [synced, setSynced] = useState(hiddenNavIds);

  if (hiddenNavIds !== synced) {
    setSynced(hiddenNavIds);
    setHidden(new Set(hiddenNavIds));
  }

  const ctx: OpsNavContext = {
    role,
    canManageSettings,
    canManageStaff,
  };

  if (!roleAllowsNavCustomization(ctx)) {
    return null;
  }

  const items = getCustomizableOpsNavItems(ctx);
  const itemIds = items.map((item) => item.id);

  function toggle(id: OpsNavId) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-title text-2xl font-bold text-[var(--color-text)]">
            {d.settings.customization}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
            {d.settings.customizationHint}
          </p>
        </div>
        {state?.success ? (
          <p
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]"
            role="status"
          >
            <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} />
            {state.success}
          </p>
        ) : null}
      </div>

      {state?.error ? (
        <p
          className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          {itemIds.map((id) =>
            hidden.has(id) ? (
              <input key={`h-${id}`} type="hidden" name="hidden" value={id} />
            ) : null,
          )}

          <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            {items.map((item) => {
              const Icon = item.icon;
              const label = item.getLabel(d);
              const shown = !hidden.has(item.id);
              return (
                <li
                  key={item.id}
                  className="flex min-h-14 items-center gap-3 px-4 py-3"
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-[var(--color-muted)]"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)]">
                    {label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shown}
                    aria-label={`${label}: ${shown ? d.settings.navVisible : d.settings.navHidden}`}
                    onClick={() => toggle(item.id)}
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                      shown
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-muted)]/35"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 rounded-full bg-[var(--color-surface)] shadow transition-transform ${
                        shown ? "translate-x-7" : "translate-x-1"
                      }`}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending} className="min-h-11">
              {pending ? d.settings.saving : d.settings.saveNav}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
