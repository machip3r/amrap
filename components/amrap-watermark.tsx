import Link from "next/link";
import { AmrapLogo } from "@/components/landing/amrap-logo";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  locale: Locale;
  label: string;
};

/** Subtle Amrap brand mark pinned to the bottom of the app shell. */
export function AmrapWatermark({ locale, label }: Props) {
  return (
    <div className="hidden shrink-0 items-center justify-center border-t border-[var(--color-border)]/60 bg-[var(--color-bg)] py-2.5 md:flex">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-[var(--color-muted)] transition-opacity hover:opacity-80"
        aria-label="AMRAP"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]/80">
          {label}
        </span>
        <AmrapLogo className="h-3.5 w-auto opacity-45" />
      </Link>
    </div>
  );
}
