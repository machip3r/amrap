import { createServerClient } from '@supabase/ssr';
import { getRequestEvent } from '$app/server';
import type { Cookies } from '@sveltejs/kit';
import { getSupabasePublishableKey, getSupabaseUrl } from '$lib/supabase/env';

function cookieAdapter(cookies: Cookies) {
	return {
		getAll() {
			return cookies.getAll();
		},
		setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
			cookiesToSet.forEach(({ name, value, options }) => {
				cookies.set(name, value, { ...(options as object), path: '/' });
			});
		}
	};
}

/** Request-scoped Supabase client (Server load, form actions, route handlers). */
export function createClient() {
	const event = getRequestEvent();
	return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
		cookies: cookieAdapter(event.cookies)
	});
}
