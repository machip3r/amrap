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
  /** Extra classes on the panel (e.g. max-w-xl). Default max-w-md unless fullScreen. */
  className?: string;
  /** Extra classes on the outer overlay flex container (e.g. full-bleed sheets). */
  containerClassName?: string;
  /** Extra classes on the scrollable body. */
  bodyClassName?: string;
  /** Focus first field when opened. Default true. */
  autoFocus?: boolean;
  /** Edge-to-edge panel filling the viewport (e.g. My QR). */
  fullScreen?: boolean;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  titleId: titleIdProp,
  closeLabel,
  className,
  containerClassName = "items-end justify-center p-3 sm:items-center sm:p-6",
  bodyClassName = "px-6 py-5",
  autoFocus = true,
  fullScreen = false,
}: Props) {
  const autoId = useId();
  const titleId = titleIdProp ?? `${autoId}-title`;
  const descId = `${autoId}-desc`;
  const panelRef = useRef<HTMLDivElement>(null);
  const panelClassName = className ?? (fullScreen ? "" : "max-w-md");

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);

    if (autoFocus) {
      const panel = panelRef.current;
      const focusTarget =
        panel?.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([type="radio"]), textarea, select',
        ) ??
        panel?.querySelector<HTMLElement>(
          'button:not([data-dialog-close]), [href], [tabindex]:not([tabindex="-1"])',
        );
      focusTarget?.focus();
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange, autoFocus]);

  if (!open) return null;

  const panelSize = fullScreen
    ? "h-dvh max-h-dvh w-full rounded-none border-0 shadow-none"
    : "max-h-[min(94vh,56rem)] w-full rounded-2xl border border-[var(--color-border)] shadow-2xl";

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        fullScreen
          ? "items-stretch justify-stretch p-0"
          : containerClassName
      }`.trim()}
    >
      {!fullScreen ? (
        <button
          type="button"
          className="absolute inset-0 bg-[var(--color-text)]/40 backdrop-blur-[2px] transition-opacity"
          aria-label={closeLabel}
          onClick={() => onOpenChange(false)}
        />
      ) : null}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`animate-fade-in-up relative z-10 flex flex-col overflow-hidden bg-[var(--color-surface)] ${panelSize} ${panelClassName}`.trim()}
      >
        <div
          className={`relative shrink-0 border-b border-[var(--color-border)] px-6 pb-4 pr-14 ${
            fullScreen
              ? "pt-[max(1.25rem,env(safe-area-inset-top))]"
              : "pt-6"
          }`}
        >
          <h2
            id={titleId}
            className="font-title text-xl font-bold tracking-tight text-[var(--color-text)] sm:text-2xl"
          >
            {title}
          </h2>
          {description ? (
            <p
              id={descId}
              className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base"
            >
              {description}
            </p>
          ) : null}
          <button
            type="button"
            data-dialog-close
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] rounded-lg p-2.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
