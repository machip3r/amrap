import type { PageServerLoad } from './$types';
import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';

/** Fast only — locale + boot label. Auth resolution is `/app/resolve`. */
export const load: PageServerLoad = async ({ cookies, request, locals }) => {
	const cookieLocale = cookies.get('amrap_locale');
	const locale: Locale =
		cookieLocale && isLocale(cookieLocale)
			? cookieLocale
			: negotiateLocale(request.headers.get('accept-language')) || defaultLocale;

	locals.locale = locale;
	const d = getDictionary(locale);

	return {
		locale,
		booting: d.pwa.booting,
		fallbackPath: `/${locale}/login`
	};
};
