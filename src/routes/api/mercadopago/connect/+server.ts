import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { canUseOnlineBilling } from '$lib/plans/limits';
import { buildMercadoPagoAuthUrl } from '$lib/payments/mercadopago/client';
import { isMercadoPagoConfigured } from '$lib/payments/mercadopago/env';
import { getMercadoPagoOAuthRedirectUri } from '$lib/payments/mercadopago/oauth';
import type { RequestHandler } from './$types';

/**
 * Starts Mercado Pago OAuth for the active gym (owner/staff with manage_billing).
 * GET /api/mercadopago/connect?locale=es&popup=1
 */
export const GET: RequestHandler = async ({ url }) => {
	const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'es';
	const popup = url.searchParams.get('popup') === '1';
	const workspace = await getWorkspace();

	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		throw redirect(303, `/${locale}/settings?gateway=forbidden`);
	}
	if (!canUseOnlineBilling(workspace.planTier)) {
		throw redirect(303, `/${locale}/settings?gateway=upgrade`);
	}
	if (!isMercadoPagoConfigured()) {
		throw redirect(303, `/${locale}/settings?gateway=not_configured`);
	}

	const redirectUri = getMercadoPagoOAuthRedirectUri();
	const state = Buffer.from(
		JSON.stringify({
			gymId: workspace.gymId,
			locale,
			popup,
			n: crypto.randomUUID()
		}),
		'utf8'
	).toString('base64url');

	const authUrl = buildMercadoPagoAuthUrl({ redirectUri, state });
	if (!authUrl) {
		throw redirect(303, `/${locale}/settings?gateway=not_configured`);
	}

	console.info('mercadopago connect redirect_uri=', redirectUri);
	throw redirect(302, authUrl);
};
