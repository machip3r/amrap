import type { SelectHTMLAttributes } from "react";

const variants = {
  auth: "min-h-11 w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-4 py-2.5 pr-10 text-base text-[var(--color-text)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
  app: "min-h-11 w-full appearance-none rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-bg)] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2.5 pr-10 text-base text-[var(--color-text)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]",
} as const;

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: keyof typeof variants;
};

export function Select({
  variant = "app",
  className = "",
  children,
  style,
  ...props
}: Props) {
  return (
    <select
      className={`${variants[variant]} ${className}`.trim()}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
