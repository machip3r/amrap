import { redirect, type RequestHandler } from '@sveltejs/kit';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';

/**
 * PWA entry (`manifest.start_url`). Sends signed-in users to their app home
 * (dashboard / member / onboarding) and everyone else to login — never the
 * marketing landing.
 */
export const GET: RequestHandler = async ({ locals, request, cookies }) => {
	const cookieLocale = cookies.get('amrap_locale');
	const locale: Locale =
		cookieLocale && isLocale(cookieLocale)
			? cookieLocale
			: negotiateLocale(request.headers.get('accept-language')) || defaultLocale;

	locals.locale = locale;

	if (!locals.user) {
		throw redirect(302, `/${locale}/login`);
	}

	throw redirect(302, await resolvePostAuthPath(locale));
};
