import type { SelectHTMLAttributes } from "react";

const variants = {
  auth: "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-[var(--color-text)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
  app: "w-full border border-[var(--color-muted)]/40 bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
} as const;

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: keyof typeof variants;
};

export function Select({ variant = "app", className = "", children, ...props }: Props) {
  return (
    <select className={`${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
