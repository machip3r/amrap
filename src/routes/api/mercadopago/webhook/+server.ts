import {
	fetchMercadoPagoPayment
} from '$lib/payments/mercadopago/client';
import { getValidMercadoPagoAccessToken } from '$lib/server/payments/gateway-accounts';
import { fulfillCheckoutFromMercadoPagoPayment } from '$lib/server/payments/online-checkout';
import { createServiceRoleClient } from '$lib/supabase/admin';
import type { RequestHandler } from './$types';

/**
 * Mercado Pago IPN / webhooks.
 * Expects query topic=payment&id=… or JSON { type, data: { id } }.
 * external_reference on the payment must be our payment_checkouts.id.
 */
export const POST: RequestHandler = async ({ request, url }) => {
	let paymentId: string | null =
		url.searchParams.get('data.id') || url.searchParams.get('id');
	let topic =
		url.searchParams.get('type') ||
		url.searchParams.get('topic') ||
		url.searchParams.get('action');
	let bodyUserId: string | null = null;

	try {
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const body = (await request.json()) as {
				type?: string;
				action?: string;
				user_id?: string | number;
				data?: { id?: string | number };
			};
			topic = topic || body.type || body.action || null;
			if (!paymentId && body.data?.id != null) paymentId = String(body.data.id);
			if (body.user_id != null) bodyUserId = String(body.user_id);
		}
	} catch {
		/* query-only IPN */
	}

	if (!paymentId) {
		return new Response(JSON.stringify({ ignored: true }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	const isPayment =
		!topic ||
		topic === 'payment' ||
		topic.startsWith('payment.') ||
		topic === 'topic_payment';

	if (!isPayment) {
		return new Response(JSON.stringify({ ignored: true, topic }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	const admin = createServiceRoleClient();
	if (!admin) {
		return new Response('Misconfigured', { status: 500 });
	}

	// We need a seller token. Look up pending checkouts… better: fetch payment with
	// each connected account is expensive. Prefer external_reference after we know gym.
	// Strategy: find PENDING checkouts is bad. Fetch with platform? OAuth tokens are seller's.
	// Store nothing platform-side. Use: try recent PENDING checkouts' gyms? Too slow.
	// Better approach: payment notifications include user_id — match gym_payment_accounts.external_user_id.

	let accessToken: string | null = null;
	let gymId: string | null = null;

	// First pass: try body user_id from a lightweight list — MP sends `user_id` on some payloads.
	// Fallback: scan connected accounts is not viable. Instead fetch payment using any
	// connected account won't work. Use application credentials? Client credentials can't read seller payments.
	// Correct: query `gym_payment_accounts` by looking up checkout via external_reference AFTER we get payment —
	// chicken and egg. MP docs: use the seller access token. Webhook includes `user_id`.

	const rawUserId =
		url.searchParams.get('user_id') ||
		url.searchParams.get('userId') ||
		bodyUserId ||
		null;

	async function resolveToken(externalUserId: string | null) {
		if (!externalUserId || !admin) return null;
		const { data: acct } = await admin
			.from('gym_payment_accounts')
			.select('gym_id')
			.eq('provider', 'MERCADOPAGO')
			.eq('status', 'CONNECTED')
			.eq('external_user_id', externalUserId)
			.maybeSingle();
		if (!acct) return null;
		gymId = acct.gym_id;
		const t = await getValidMercadoPagoAccessToken(acct.gym_id);
		return t.ok ? t.accessToken : null;
	}

	if (rawUserId) {
		accessToken = await resolveToken(rawUserId);
	}

	// If no user_id, try reading payment id from already-known preference: look up
	// payment_checkouts by scanning is not possible. Attempt JSON body user_id above.
	// Last resort: fetch payment details are impossible without token.
	// Alternative last resort: find PENDING checkout updated recently — skip.
	// For missing user_id, parse payment via each? No.
	// Many MP notifications put user_id in query for IPN.

	if (!accessToken) {
		// Try: body may have been consumed; re-check DB for checkout if payment already linked — no.
		// Accept 200 and log — MP will retry; when we have user_id it works.
		// Also try: if only one CONNECTED MP account in whole system (dev), use it.
		const { data: accounts } = await admin
			.from('gym_payment_accounts')
			.select('gym_id')
			.eq('provider', 'MERCADOPAGO')
			.eq('status', 'CONNECTED')
			.limit(2);

		if (accounts?.length === 1) {
			gymId = accounts[0].gym_id;
			const t = await getValidMercadoPagoAccessToken(accounts[0].gym_id);
			if (t.ok) accessToken = t.accessToken;
		}
	}

	if (!accessToken) {
		console.error('mercadopago webhook: no access token for payment', paymentId);
		return new Response(JSON.stringify({ error: 'no_token' }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	const payment = await fetchMercadoPagoPayment(accessToken, paymentId);
	if (!payment.ok) {
		console.error('mercadopago webhook fetch payment', payment.message);
		return new Response(JSON.stringify({ error: 'fetch_failed' }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	const mp = payment.payment;
	if (mp.status !== 'approved') {
		return new Response(JSON.stringify({ status: mp.status }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	const checkoutId = mp.external_reference?.trim();
	if (!checkoutId) {
		console.error('mercadopago webhook: missing external_reference', paymentId);
		return new Response(JSON.stringify({ error: 'no_reference' }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	// If we didn't know gym yet, validate checkout belongs to token gym
	if (gymId) {
		const { data: checkout } = await admin
			.from('payment_checkouts')
			.select('gym_id')
			.eq('id', checkoutId)
			.maybeSingle();
		if (checkout && checkout.gym_id !== gymId) {
			console.error('mercadopago webhook gym mismatch', checkoutId);
			return new Response(JSON.stringify({ error: 'gym_mismatch' }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			});
		}
	}

	const fulfilled = await fulfillCheckoutFromMercadoPagoPayment({
		checkoutId,
		providerPaymentId: String(mp.id),
		paidAmount: mp.transaction_amount
	});

	if (!fulfilled.ok) {
		console.error('mercadopago webhook fulfill', fulfilled.message);
		return new Response(JSON.stringify({ error: fulfilled.message }), {
			status: 500,
			headers: { 'content-type': 'application/json' }
		});
	}

	return new Response(JSON.stringify({ ok: true, already: fulfilled.already ?? false }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};

export const GET: RequestHandler = async (event) => {
	// MP sometimes hits GET for IPN
	return POST(event);
};
