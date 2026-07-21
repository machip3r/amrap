import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function processEnv(name: string): string | undefined {
	if (typeof process === 'undefined') return undefined;
	return process.env[name]?.trim() || undefined;
}

/** Publishable key — safe for browser if ever needed. Prefer PUBLIC_*. */
export function getStripePublishableKey(): string | undefined {
	return (
		publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
		processEnv('PUBLIC_STRIPE_PUBLISHABLE_KEY')
	);
}

/** Server-only secret (or restricted) key. Never expose to the client. */
export function getStripeSecretKey(): string | undefined {
	return privateEnv.STRIPE_SECRET_KEY?.trim() || processEnv('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string | undefined {
	return privateEnv.STRIPE_WEBHOOK_SECRET?.trim() || processEnv('STRIPE_WEBHOOK_SECRET');
}
