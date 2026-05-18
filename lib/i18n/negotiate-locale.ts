import { defaultLocale, type Locale } from "./config";

/** Pick `es` or `en` from the browser's Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const lang of languages) {
    if (lang.startsWith("es")) return "es";
    if (lang.startsWith("en")) return "en";
  }

  return defaultLocale;
}
