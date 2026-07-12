"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional id for aria-labelledby; auto-generated if omitted */
  titleId?: string;
  closeLabel: string;
  /** Extra classes on the panel (e.g. max-w-xl). Default max-w-md. */
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  titleId: titleIdProp,
  closeLabel,
  className = "",
}: Props) {
  const autoId = useId();
  const titleId = titleIdProp ?? `${autoId}-title`;
  const descId = `${autoId}-desc`;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);

    const panel = panelRef.current;
    const focusTarget =
      panel?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([type="radio"]), textarea, select',
      ) ??
      panel?.querySelector<HTMLElement>(
        'button:not([data-dialog-close]), [href], [tabindex]:not([tabindex="-1"])',
      );
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-text)]/40 backdrop-blur-[2px] transition-opacity"
        aria-label={closeLabel}
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`animate-fade-in-up relative z-10 flex max-h-[min(92vh,44rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl ${className}`.trim()}
      >
        <div className="relative border-b border-[var(--color-border)] px-6 pb-4 pt-6 pr-14">
          <h2
            id={titleId}
            className="font-title text-xl font-bold tracking-tight text-[var(--color-text)]"
          >
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
              {description}
            </p>
          ) : null}
          <button
            type="button"
            data-dialog-close
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-lg p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
