import { headers } from "next/headers";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ClassesLoadingSplash } from "@/components/classes-loading";

export default async function ClassesLoading() {
  const h = await headers();
  const raw = h.get("x-locale") ?? "es";
  const locale: Locale = isLocale(raw) ? raw : "es";
  const d = getDictionary(locale);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-md bg-[var(--color-border)]/55" />
        <div className="h-3.5 w-56 max-w-full animate-pulse rounded-md bg-[var(--color-border)]/40" />
      </div>
      <ClassesLoadingSplash label={d.classes.loading} variant="catalog" />
    </div>
  );
}
