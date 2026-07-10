import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  /** auth = stacked label above control; app = muted span inside wrapping label look */
  variant?: "auth" | "app";
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  children,
  variant = "app",
  className = "",
}: Props) {
  if (variant === "auth") {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
        {children}
      </div>
    );
  }

  return (
    <label
      htmlFor={htmlFor}
      className={`flex flex-col gap-1 text-sm ${className}`.trim()}
    >
      <span className="text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}
