/** Curated dial codes for gym ops (LATAM-first, then common). */
export type PhoneCountry = {
	/** ISO 3166-1 alpha-2 */
	iso2: string;
	/** Country calling code without + */
	dial: string;
};

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
	{ iso2: 'MX', dial: '52' },
	{ iso2: 'US', dial: '1' },
	{ iso2: 'CA', dial: '1' },
	{ iso2: 'ES', dial: '34' },
	{ iso2: 'AR', dial: '54' },
	{ iso2: 'BO', dial: '591' },
	{ iso2: 'BR', dial: '55' },
	{ iso2: 'CL', dial: '56' },
	{ iso2: 'CO', dial: '57' },
	{ iso2: 'CR', dial: '506' },
	{ iso2: 'EC', dial: '593' },
	{ iso2: 'SV', dial: '503' },
	{ iso2: 'GT', dial: '502' },
	{ iso2: 'HN', dial: '504' },
	{ iso2: 'NI', dial: '505' },
	{ iso2: 'PA', dial: '507' },
	{ iso2: 'PY', dial: '595' },
	{ iso2: 'PE', dial: '51' },
	{ iso2: 'UY', dial: '598' },
	{ iso2: 'VE', dial: '58' },
	{ iso2: 'GB', dial: '44' },
	{ iso2: 'DE', dial: '49' },
	{ iso2: 'FR', dial: '33' },
	{ iso2: 'IT', dial: '39' },
	{ iso2: 'PT', dial: '351' }
] as const;

export const DEFAULT_PHONE_COUNTRY = 'MX';

const FLAG_OFFSET = 0x1f1e6 - 65;

/** Regional-indicator flag emoji from ISO2 (e.g. MX → 🇲🇽). */
export function flagEmoji(iso2: string): string {
	const code = iso2.toUpperCase();
	if (!/^[A-Z]{2}$/.test(code)) return '';
	return String.fromCodePoint(...[...code].map((c) => FLAG_OFFSET + c.charCodeAt(0)));
}

export function countryByIso2(iso2: string): PhoneCountry | undefined {
	return PHONE_COUNTRIES.find((c) => c.iso2 === iso2.toUpperCase());
}

/** Digits only from a national number fragment. */
export function nationalDigits(value: string): string {
	return value.replace(/\D/g, '');
}

/** Build E.164-ish `+{dial}{national}` or empty string if no national digits. */
export function formatInternationalPhone(dial: string, national: string): string {
	const digits = nationalDigits(national);
	if (!digits) return '';
	const dialDigits = dial.replace(/\D/g, '');
	return `+${dialDigits}${digits}`;
}

/**
 * Best-effort parse of a stored phone into country + national.
 * Prefers longest matching dial code among known countries.
 */
export function parseInternationalPhone(value: string): {
	iso2: string;
	dial: string;
	national: string;
} {
	const trimmed = value.trim();
	if (!trimmed) {
		const fallback = countryByIso2(DEFAULT_PHONE_COUNTRY)!;
		return { iso2: fallback.iso2, dial: fallback.dial, national: '' };
	}

	const digits = trimmed.replace(/[^\d+]/g, '');
	const withPlus = digits.startsWith('+') ? digits : `+${digits.replace(/\D/g, '')}`;
	const body = withPlus.slice(1);

	const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
	for (const c of sorted) {
		if (body.startsWith(c.dial)) {
			return {
				iso2: c.iso2,
				dial: c.dial,
				national: body.slice(c.dial.length)
			};
		}
	}

	const fallback = countryByIso2(DEFAULT_PHONE_COUNTRY)!;
	return {
		iso2: fallback.iso2,
		dial: fallback.dial,
		national: body
	};
}
