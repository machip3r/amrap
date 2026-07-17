import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { isLocale, type Locale } from '$lib/i18n/config';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';
import { getSupabasePublishableKey, getSupabaseUrl } from '$lib/supabase/env';

const publicPathRoots = new Set(['login', 'register']);

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/_next') || /\.[a-zA-Z0-9]+$/.test(pathname)) {
		return resolve(event);
	}

	event.locals.supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;

	if (pathname.startsWith('/auth/')) {
		return resolve(event);
	}

	const segments = pathname.split('/').filter(Boolean);
	const first = segments[0];

	if (!first || !isLocale(first)) {
		const suffix = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`;
		const locale = negotiateLocale(event.request.headers.get('accept-language'));
		throw redirect(302, `/${locale}${suffix}`);
	}

	const locale = first;
	const firstSegment = segments[1] ?? '';
	event.locals.locale = locale as Locale;

	const isPublic = publicPathRoots.has(firstSegment);
	const isMarketingHome = segments.length === 1;

	if (!user && !isPublic && !isMarketingHome) {
		throw redirect(302, `/${locale}/login`);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};
