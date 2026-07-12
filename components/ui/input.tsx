import { forwardRef, type InputHTMLAttributes } from "react";

const variants = {
  auth: "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
  authPassword:
    "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] py-2.5 pl-4 pr-10 text-[var(--color-text)] placeholder-[var(--color-muted)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
  app: "w-full border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
  search:
    "block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)] py-1.5 pl-10 pr-3 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]",
} as const;

export type InputVariant = keyof typeof variants;

type Props = InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { variant = "app", className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
});
