import {
	getMercadoPagoClientId,
	getMercadoPagoClientSecret
} from '$lib/payments/mercadopago/env';

const MP_API = 'https://api.mercadopago.com';
/** Canonical OAuth host (works for MX; .com.mx also redirects here). */
const MP_AUTH = 'https://auth.mercadopago.com/authorization';

export type MercadoPagoTokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
	user_id: number;
	refresh_token: string;
	public_key?: string;
	live_mode?: boolean;
};

export type MercadoPagoPreference = {
	id: string;
	init_point: string;
	sandbox_init_point?: string;
};

export function buildMercadoPagoAuthUrl(opts: {
	redirectUri: string;
	state: string;
}): string | null {
	const clientId = getMercadoPagoClientId();
	if (!clientId) return null;
	const u = new URL(MP_AUTH);
	u.searchParams.set('client_id', clientId);
	u.searchParams.set('response_type', 'code');
	u.searchParams.set('platform_id', 'mp');
	u.searchParams.set('state', opts.state);
	u.searchParams.set('redirect_uri', opts.redirectUri);
	return u.toString();
}

async function mpFetch<T>(
	path: string,
	opts: {
		method?: string;
		accessToken?: string;
		body?: unknown;
		/** OAuth token endpoint expects form body per MP docs. */
		form?: Record<string, string>;
	} = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
	const headers: Record<string, string> = {
		Accept: 'application/json'
	};
	if (opts.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;

	let body: string | undefined;
	if (opts.form) {
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
		body = new URLSearchParams(opts.form).toString();
	} else if (opts.body !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(opts.body);
	}

	const res = await fetch(`${MP_API}${path}`, {
		method: opts.method ?? (body ? 'POST' : 'GET'),
		headers,
		body
	});

	const text = await res.text();
	let json: unknown = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = null;
	}

	if (!res.ok) {
		const message =
			(json && typeof json === 'object' && 'message' in json
				? String((json as { message: unknown }).message)
				: null) ||
			text ||
			`HTTP ${res.status}`;
		return { ok: false, status: res.status, message };
	}

	return { ok: true, data: json as T };
}

export async function exchangeMercadoPagoCode(opts: {
	code: string;
	redirectUri: string;
}): Promise<
	{ ok: true; token: MercadoPagoTokenResponse } | { ok: false; message: string }
> {
	const clientId = getMercadoPagoClientId();
	const clientSecret = getMercadoPagoClientSecret();
	if (!clientId || !clientSecret) {
		return { ok: false, message: 'Mercado Pago is not configured' };
	}

	const result = await mpFetch<MercadoPagoTokenResponse>('/oauth/token', {
		method: 'POST',
		form: {
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'authorization_code',
			code: opts.code,
			redirect_uri: opts.redirectUri
		}
	});

	if (!result.ok) return { ok: false, message: result.message };
	return { ok: true, token: result.data };
}

export async function refreshMercadoPagoToken(
	refreshToken: string
): Promise<
	{ ok: true; token: MercadoPagoTokenResponse } | { ok: false; message: string }
> {
	const clientId = getMercadoPagoClientId();
	const clientSecret = getMercadoPagoClientSecret();
	if (!clientId || !clientSecret) {
		return { ok: false, message: 'Mercado Pago is not configured' };
	}

	const result = await mpFetch<MercadoPagoTokenResponse>('/oauth/token', {
		method: 'POST',
		form: {
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}
	});

	if (!result.ok) return { ok: false, message: result.message };
	return { ok: true, token: result.data };
}

export async function createMercadoPagoPreference(opts: {
	accessToken: string;
	title: string;
	quantity: number;
	unitPrice: number;
	externalReference: string;
	notificationUrl: string;
	backUrls: { success: string; failure: string; pending: string };
	payerEmail?: string | null;
}): Promise<{ ok: true; preference: MercadoPagoPreference } | { ok: false; message: string }> {
	const result = await mpFetch<MercadoPagoPreference>('/checkout/preferences', {
		method: 'POST',
		accessToken: opts.accessToken,
		body: {
			items: [
				{
					title: opts.title.slice(0, 256),
					quantity: opts.quantity,
					unit_price: Number(opts.unitPrice.toFixed(2)),
					currency_id: 'MXN'
				}
			],
			external_reference: opts.externalReference,
			notification_url: opts.notificationUrl,
			back_urls: opts.backUrls,
			auto_return: 'approved',
			binary_mode: true,
			...(opts.payerEmail
				? { payer: { email: opts.payerEmail } }
				: {})
		}
	});

	if (!result.ok) return { ok: false, message: result.message };
	if (!result.data?.id || !result.data?.init_point) {
		return { ok: false, message: 'Invalid preference response' };
	}
	return { ok: true, preference: result.data };
}

export type MercadoPagoPayment = {
	id: number;
	status: string;
	status_detail?: string;
	transaction_amount?: number;
	external_reference?: string;
	live_mode?: boolean;
};

export async function fetchMercadoPagoPayment(
	accessToken: string,
	paymentId: string | number
): Promise<{ ok: true; payment: MercadoPagoPayment } | { ok: false; message: string }> {
	const result = await mpFetch<MercadoPagoPayment>(`/v1/payments/${paymentId}`, {
		accessToken
	});
	if (!result.ok) return { ok: false, message: result.message };
	return { ok: true, payment: result.data };
}
