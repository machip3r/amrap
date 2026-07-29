import { createServerClient } from '@supabase/ssr';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { isLocale, type Locale } from '$lib/i18n/config';
import { negotiateLocale } from '$lib/i18n/negotiate-locale';
import { getSupabasePublishableKey, getSupabaseUrl } from '$lib/supabase/env';

const publicPathRoots = new Set(['login', 'register']);

/**
 * First path segment under `/[locale]/…` that exists as an app route.
 * Unknown segments must 404 (not soft-redirect to login) so crawlers do not
 * invent redirect chains like `/mes` → `/es/mes` → `/es/login`.
 */
const knownLocaleRoots = new Set([
	'login',
	'register',
	'dashboard',
	'members',
	'checkin',
	'classes',
	'payments',
	'plans',
	'staff',
	'trainers',
	'timers',
	'settings',
	'organization',
	'gym-info',
	'team',
	'me',
	'onboarding',
	'welcome',
	'invite',
	'profile',
	'no-access',
	'complete-setup'
]);

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
					// Preserve Supabase maxAge / httpOnly so the session survives PWA cold starts.
					event.cookies.set(name, value, {
						...options,
						path: '/',
						sameSite: options?.sameSite ?? 'lax'
					});
				});
			}
		}
	});

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;

	// Auth callbacks + public HTTP APIs + PWA cold-start entry — no locale prefix.
	if (
		pathname.startsWith('/auth/') ||
		pathname.startsWith('/api/') ||
		pathname === '/app' ||
		pathname.startsWith('/app/')
	) {
		return resolve(event);
	}

	const segments = pathname.split('/').filter(Boolean);
	const first = segments[0];

	if (!first || !isLocale(first)) {
		const locale = negotiateLocale(event.request.headers.get('accept-language'));
		// Bare `/` → locale home. Unknown top-level paths 404 (avoid crawlable redirect chains).
		if (!first) {
			throw redirect(302, `/${locale}`);
		}
		if (!knownLocaleRoots.has(first)) {
			throw error(404);
		}
		const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`;
		throw redirect(302, `/${locale}${suffix}`);
	}

	const locale = first;
	const firstSegment = segments[1] ?? '';
	event.locals.locale = locale as Locale;

	// Remember last locale for PWA `/app` cold starts.
	event.cookies.set('amrap_locale', locale, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax',
		httpOnly: false
	});

	const isPublic = publicPathRoots.has(firstSegment);
	const isMarketingHome = segments.length === 1;

	if (!user && !isPublic && !isMarketingHome) {
		// Unknown routes → real 404. Known private routes → login.
		if (!knownLocaleRoots.has(firstSegment)) {
			throw error(404);
		}
		throw redirect(302, `/${locale}/login`);
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};
