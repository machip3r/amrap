import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';

function resolveLocale(cookies: Parameters<RequestHandler>[0]['cookies'], request: Request): Locale {
	const cookieLocale = cookies.get('amrap_locale');
	return cookieLocale && isLocale(cookieLocale)
		? cookieLocale
		: negotiateLocale(request.headers.get('accept-language')) || defaultLocale;
}

/**
 * PWA cold-start resolve (`manifest.start_url` → `/app` splash fetches this).
 * JSON for the splash page; HTML navigations redirect (avoids a dead 404 if
 * `/app/resolve` is opened as a document).
 */
export const GET: RequestHandler = async ({ locals, request, cookies }) => {
	const locale = resolveLocale(cookies, request);
	locals.locale = locale;

	const path = !locals.user ? `/${locale}/login` : await resolvePostAuthPath(locale);

	const accept = request.headers.get('accept') ?? '';
	if (accept.includes('text/html') && !accept.includes('application/json')) {
		throw redirect(302, path);
	}

	return json({ path });
};
