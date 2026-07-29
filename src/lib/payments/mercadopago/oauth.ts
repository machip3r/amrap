import { getPublicAppUrl } from '$lib/supabase/env';
import { getRequestOrigin } from '$lib/http/origin';

/**
 * Stable redirect URI for Mercado Pago OAuth.
 * Must match the Redirect URL configured in the MP application exactly.
 * Prefer PUBLIC_APP_URL so local/prod don't drift from Host headers.
 */
export function getMercadoPagoOAuthRedirectUri(): string {
	const base = (getPublicAppUrl() || getRequestOrigin()).replace(/\/$/, '');
	return `${base}/api/mercadopago/callback`;
}
