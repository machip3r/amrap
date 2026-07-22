import { env as publicEnv } from '$env/dynamic/public';

/**
 * Supabase project URL (same for publishable vs legacy keys).
 * Safe for browser + server (public vars only).
 *
 * Uses `$env/dynamic/public` so optional / fallback vars (e.g. PUBLIC_APP_URL)
 * do not fail the Vite build when unset on Vercel.
 */
export function getSupabaseUrl(): string {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	if (!url) {
		throw new Error('Missing PUBLIC_SUPABASE_URL');
	}
	return url;
}

/** Public client key: publishable or legacy anon JWT. */
export function getSupabasePublishableKey(): string {
	const key =
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		envFallback('PUBLIC_SUPABASE_ANON_KEY');
	if (!key) {
		throw new Error(
			'Missing PUBLIC_SUPABASE_PUBLISHABLE_KEY (or PUBLIC_SUPABASE_ANON_KEY)'
		);
	}
	return key;
}

export function getPublicAppUrl(): string | undefined {
	const url = publicEnv.PUBLIC_APP_URL;
	return url?.trim().replace(/\/$/, '');
}

function envFallback(name: string): string | undefined {
	if (typeof process === 'undefined') return undefined;
	const value = process.env[name]?.trim();
	return value || undefined;
}
