import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function processEnv(name: string): string | undefined {
	if (typeof process === 'undefined') return undefined;
	return process.env[name]?.trim() || undefined;
}

/** Mercado Pago application client id (OAuth / public). Prefer PUBLIC_*. */
export function getMercadoPagoClientId(): string | undefined {
	return (
		publicEnv.PUBLIC_MERCADOPAGO_CLIENT_ID?.trim() ||
		processEnv('PUBLIC_MERCADOPAGO_CLIENT_ID') ||
		privateEnv.MERCADOPAGO_CLIENT_ID?.trim() ||
		processEnv('MERCADOPAGO_CLIENT_ID')
	);
}

/** Server-only client secret. Never expose to the browser. */
export function getMercadoPagoClientSecret(): string | undefined {
	return (
		privateEnv.MERCADOPAGO_CLIENT_SECRET?.trim() || processEnv('MERCADOPAGO_CLIENT_SECRET')
	);
}

/** Optional webhook secret / shared validation (x-signature). */
export function getMercadoPagoWebhookSecret(): string | undefined {
	return (
		privateEnv.MERCADOPAGO_WEBHOOK_SECRET?.trim() || processEnv('MERCADOPAGO_WEBHOOK_SECRET')
	);
}

export function isMercadoPagoConfigured(): boolean {
	return Boolean(getMercadoPagoClientId() && getMercadoPagoClientSecret());
}
