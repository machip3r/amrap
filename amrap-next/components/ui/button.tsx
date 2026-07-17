import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70",
  primaryBlock:
    "mt-2 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70",
  appPrimary:
    "mt-2 bg-[var(--color-primary)] px-3 py-2 text-sm text-[var(--color-primary-on)] transition-colors duration-200 hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70",
  ghost:
    "text-[var(--color-muted)] transition-colors duration-200 hover:text-[var(--color-text)] disabled:opacity-70",
  link: "text-sm text-[var(--color-primary)] underline transition-colors hover:opacity-80",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
