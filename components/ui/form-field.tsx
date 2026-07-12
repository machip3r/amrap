"use client";

import type { ReactElement, ReactNode } from "react";
import { Children, cloneElement, isValidElement, useId } from "react";

type Props = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  /** auth = stacked label above control; app = muted span inside wrapping label look */
  variant?: "auth" | "app";
  className?: string;
  error?: string;
};

function withA11y(
  children: ReactNode,
  opts: { errorId: string; invalid: boolean },
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{
      "aria-invalid"?: boolean;
      "aria-describedby"?: string;
      className?: string;
    }>;
    const describedBy = [el.props["aria-describedby"], opts.invalid ? opts.errorId : null]
      .filter(Boolean)
      .join(" ");
    return cloneElement(el, {
      "aria-invalid": opts.invalid || undefined,
      "aria-describedby": describedBy || undefined,
      className: [
        el.props.className,
        opts.invalid
          ? "border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  });
}

export function FormField({
  label,
  htmlFor,
  children,
  variant = "app",
  className = "",
  error,
}: Props) {
  const reactId = useId();
  const errorId = `${reactId}-error`;
  const invalid = Boolean(error);
  const control = withA11y(children, { errorId, invalid });

  const errorNode = error ? (
    <p
      id={errorId}
      className="text-sm font-medium text-[var(--color-primary)]"
      role="alert"
    >
      {error}
    </p>
  ) : null;

  if (variant === "auth") {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
        {control}
        {errorNode}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 text-sm ${className}`.trim()}>
      <label htmlFor={htmlFor} className="flex flex-col gap-1">
        <span className="text-[var(--color-muted)]">{label}</span>
        {control}
      </label>
      {errorNode}
    </div>
  );
}
