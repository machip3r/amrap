"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const d = getDictionary(locale);

  const rest =
    pathname.replace(new RegExp(`^/(${locales.join("|")})`), "") || "/";

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
      <span>{d.common.locale}:</span>
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest === "/" ? "" : rest}`}
          className={
            l === locale
              ? "font-semibold text-[var(--color-primary)]"
              : "hover:underline"
          }
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
