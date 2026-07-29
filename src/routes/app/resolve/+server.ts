import { json, type RequestHandler } from '@sveltejs/kit';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';

/**
 * PWA cold-start resolve (`manifest.start_url` → `/app` splash fetches this).
 * Returns the post-auth destination as JSON so `/app` can paint a splash first.
 */
export const GET: RequestHandler = async ({ locals, request, cookies }) => {
	const cookieLocale = cookies.get('amrap_locale');
	const locale: Locale =
		cookieLocale && isLocale(cookieLocale)
			? cookieLocale
			: negotiateLocale(request.headers.get('accept-language')) || defaultLocale;

	locals.locale = locale;

	if (!locals.user) {
		return json({ path: `/${locale}/login` });
	}

	return json({ path: await resolvePostAuthPath(locale) });
};
