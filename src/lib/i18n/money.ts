import type { Locale } from '$lib/i18n/config';

/** Display currency follows UI language (es → MXN, en → USD). */
function currencyCodeForLocale(locale: Locale): 'USD' | 'MXN' {
	return locale === 'en' ? 'USD' : 'MXN';
}

/** e.g. `$42 USD` / `$849 MXN` */
export function formatMoney(
	amount: number,
	locale: Locale,
	options?: { maximumFractionDigits?: number }
): string {
	const code = currencyCodeForLocale(locale);
	const max = options?.maximumFractionDigits ?? (amount % 1 === 0 ? 0 : 2);
	const formatted = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
		maximumFractionDigits: max,
		minimumFractionDigits: amount % 1 === 0 ? 0 : Math.min(2, max)
	}).format(amount);
	return `$${formatted} ${code}`;
}
