import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { exchangeMercadoPagoCode } from '$lib/payments/mercadopago/client';
import { getMercadoPagoOAuthRedirectUri } from '$lib/payments/mercadopago/oauth';
import {
	syncMercadoPagoPlans,
	upsertMercadoPagoAccount
} from '$lib/server/payments/gateway-accounts';
import type { RequestHandler } from './$types';

type OAuthState = { gymId: string; locale: string; n: string; popup?: boolean };

function parseState(raw: string | null): OAuthState | null {
	if (!raw) return null;
	try {
		const json = Buffer.from(raw, 'base64url').toString('utf8');
		const parsed = JSON.parse(json) as OAuthState;
		if (!parsed?.gymId || !parsed?.locale) return null;
		return parsed;
	} catch {
		return null;
	}
}

function popupCloseHtml(result: 'connected' | 'denied' | 'error' | 'forbidden'): Response {
	const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>AMRAP</title></head>
<body>
<script>
(function () {
  var payload = { source: 'amrap-mp-oauth', result: ${JSON.stringify(result)} };
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }
  } catch (e) {}
  window.close();
  setTimeout(function () {
    document.body.textContent = 'Puedes cerrar esta ventana.';
  }, 400);
})();
</script>
</body>
</html>`;
	return new Response(html, {
		status: 200,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store'
		}
	});
}

/**
 * OAuth callback — exchanges code and stores gym tokens.
 * GET /api/mercadopago/callback?code=&state=
 */
export const GET: RequestHandler = async ({ url }) => {
	const state = parseState(url.searchParams.get('state'));
	const locale = state?.locale === 'en' ? 'en' : 'es';
	const popup = Boolean(state?.popup);
	const code = url.searchParams.get('code');
	const oauthError = url.searchParams.get('error');

	const finish = (result: 'connected' | 'denied' | 'error' | 'forbidden') => {
		if (popup) return popupCloseHtml(result);
		throw redirect(303, `/${locale}/settings?gateway=${result}`);
	};

	if (oauthError || !code || !state) {
		return finish('denied');
	}

	const workspace = await getWorkspace();
	if (
		!workspace ||
		!canInWorkspace(workspace, 'manage_billing') ||
		workspace.gymId !== state.gymId
	) {
		return finish('forbidden');
	}

	const redirectUri = getMercadoPagoOAuthRedirectUri();
	const exchanged = await exchangeMercadoPagoCode({ code, redirectUri });
	if (!exchanged.ok) {
		console.error('mercadopago callback exchange', exchanged.message, 'redirect_uri=', redirectUri);
		return finish('error');
	}

	const saved = await upsertMercadoPagoAccount(workspace.gymId, exchanged.token);
	if (!saved.ok) {
		return finish('error');
	}

	await syncMercadoPagoPlans(workspace.gymId);
	return finish('connected');
};
