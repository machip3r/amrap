import { getRequestEvent } from '$app/server';
import { getPublicAppUrl } from '$lib/supabase/env';

/** Resolves the public app origin for auth redirects. */
export function getRequestOrigin(): string {
	const event = getRequestEvent();
	const fromOrigin = event.request.headers.get('origin');
	if (fromOrigin) return fromOrigin.replace(/\/$/, '');

	const host =
		event.request.headers.get('x-forwarded-host') ?? event.request.headers.get('host');
	const proto = event.request.headers.get('x-forwarded-proto') ?? event.url.protocol.replace(':', '');
	if (host) return `${proto}://${host}`.replace(/\/$/, '');

	const env = getPublicAppUrl();
	if (env) return env;

	return event.url.origin.replace(/\/$/, '');
}
