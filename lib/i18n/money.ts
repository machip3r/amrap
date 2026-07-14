import type { Locale } from "@/lib/i18n/config";

/** Display currency follows UI language (es → MX, en → US). */
export function currencyPrefixForLocale(locale: Locale): "$US" | "$MX" {
  return locale === "en" ? "$US" : "$MX";
}

export function formatMoney(
  amount: number,
  locale: Locale,
  options?: { maximumFractionDigits?: number },
): string {
  const prefix = currencyPrefixForLocale(locale);
  const max =
    options?.maximumFractionDigits ?? (amount % 1 === 0 ? 0 : 2);
  const formatted = new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
    maximumFractionDigits: max,
    minimumFractionDigits: amount % 1 === 0 ? 0 : Math.min(2, max),
  }).format(amount);
  return `${prefix} ${formatted}`;
}
