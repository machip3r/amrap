import {
	PUBLIC_APP_URL,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	PUBLIC_SUPABASE_URL
} from '$env/static/public';

/**
 * Supabase project URL (same for publishable vs legacy keys).
 * Falls back to NEXT_PUBLIC_* when sharing .env with amrap-next.
 * Safe for browser + server (public vars only).
 */
export function getSupabaseUrl(): string {
	const url = PUBLIC_SUPABASE_URL || envFallback('NEXT_PUBLIC_SUPABASE_URL');
	if (!url) {
		throw new Error('Missing PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
	}
	return url;
}

/** Public client key: publishable or legacy anon JWT. */
export function getSupabasePublishableKey(): string {
	const key =
		PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		envFallback('PUBLIC_SUPABASE_ANON_KEY') ||
		envFallback('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
		envFallback('NEXT_PUBLIC_SUPABASE_ANON_KEY');
	if (!key) {
		throw new Error(
			'Missing PUBLIC_SUPABASE_PUBLISHABLE_KEY (or PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_* equivalents)'
		);
	}
	return key;
}

export function getPublicAppUrl(): string | undefined {
	const url = PUBLIC_APP_URL || envFallback('NEXT_PUBLIC_APP_URL');
	return url?.trim().replace(/\/$/, '');
}

function envFallback(name: string): string | undefined {
	if (typeof process === 'undefined') return undefined;
	const value = process.env[name]?.trim();
	return value || undefined;
}
