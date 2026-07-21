import { getPublicAppUrl } from '$lib/supabase/env';
import type { Locale } from '$lib/i18n/config';
import { defaultLocale } from '$lib/i18n/config';

/** Production marketing origin when env is missing (local/dev). Prefer www — apex redirects there. */
export const FALLBACK_SITE_ORIGIN = 'https://www.amrap.space';

export const OG_IMAGE_PATH = '/images/hero-gym.png';

/** Apex `amrap.space` 308s to www — keep canonicals on the final host. */
export function normalizePublicOrigin(url: string): string {
	try {
		const parsed = new URL(url);
		if (parsed.hostname === 'amrap.space') {
			parsed.hostname = 'www.amrap.space';
		}
		return parsed.origin;
	} catch {
		return url.replace(/\/$/, '');
	}
}

export function getSiteOrigin(): string {
	return normalizePublicOrigin(getPublicAppUrl() || FALLBACK_SITE_ORIGIN);
}

export function absoluteUrl(path: string, origin = getSiteOrigin()): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${origin.replace(/\/$/, '')}${normalized}`;
}

export function localePath(locale: Locale, path = ''): string {
	const clean = path.replace(/^\//, '');
	return clean ? `/${locale}/${clean}` : `/${locale}`;
}

export function alternateLocale(locale: Locale): Locale {
	return locale === 'es' ? 'en' : 'es';
}

export function ogLocale(locale: Locale): string {
	return locale === 'es' ? 'es_MX' : 'en_US';
}

/** Prefer production origin in sitemap/robots even if local PUBLIC_APP_URL is set. */
export function getPublicSeoOrigin(): string {
	const fromEnv = getPublicAppUrl();
	if (!fromEnv) return FALLBACK_SITE_ORIGIN;
	if (/localhost|127\.0\.0\.1/i.test(fromEnv)) return FALLBACK_SITE_ORIGIN;
	return normalizePublicOrigin(fromEnv);
}

export { defaultLocale };
