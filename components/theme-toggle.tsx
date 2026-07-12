"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type Props = {
  className?: string;
  label: string;
};

/**
 * Icons are CSS-toggled via `.dark` so server and client markup match.
 * Theme is only read on click (after hydration).
 */
export function ThemeToggle({ className = "", label }: Props) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] ${className}`}
      aria-label={label}
    >
      <Moon className="h-5 w-5 scale-100 transition-all dark:scale-0 dark:opacity-0" aria-hidden />
      <Sun className="absolute h-5 w-5 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100" aria-hidden />
    </button>
  );
}
