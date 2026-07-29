/**
 * Gym payment provider accounts (OAuth).
 * Token columns are service-role only in Postgres — never query this table with the
 * user-scoped client if you need secrets. UI must use {@link toPublicAccount}.
 */
import { createServiceRoleClient } from '$lib/supabase/admin';
import {
	refreshMercadoPagoToken,
	type MercadoPagoTokenResponse
} from '$lib/payments/mercadopago/client';
import type { PaymentAccountStatus, PaymentProvider } from '$lib/types';

export type GymPaymentAccountRow = {
	id: string;
	gym_id: string;
	provider: PaymentProvider;
	status: PaymentAccountStatus;
	external_user_id: string | null;
	access_token: string | null;
	refresh_token: string | null;
	token_expires_at: string | null;
	public_key: string | null;
	live_mode: boolean;
	connected_at: string | null;
	last_error: string | null;
};

/** Public shape safe for UI (no tokens). */
export type GymPaymentAccountPublic = {
	provider: PaymentProvider;
	status: PaymentAccountStatus;
	externalUserId: string | null;
	liveMode: boolean;
	connectedAt: string | null;
	lastError: string | null;
	enabledPlanCount: number;
};

export function toPublicAccount(
	row: Pick<
		GymPaymentAccountRow,
		| 'provider'
		| 'status'
		| 'external_user_id'
		| 'live_mode'
		| 'connected_at'
		| 'last_error'
	>,
	enabledPlanCount = 0
): GymPaymentAccountPublic {
	return {
		provider: row.provider,
		status: row.status,
		externalUserId: row.external_user_id,
		liveMode: row.live_mode,
		connectedAt: row.connected_at,
		lastError: row.last_error,
		enabledPlanCount
	};
}

export async function loadGymPaymentAccount(
	gymId: string,
	provider: PaymentProvider = 'MERCADOPAGO'
): Promise<GymPaymentAccountRow | null> {
	const admin = createServiceRoleClient();
	if (!admin) return null;
	const { data } = await admin
		.from('gym_payment_accounts')
		.select(
			'id, gym_id, provider, status, external_user_id, access_token, refresh_token, token_expires_at, public_key, live_mode, connected_at, last_error'
		)
		.eq('gym_id', gymId)
		.eq('provider', provider)
		.maybeSingle();
	return (data as GymPaymentAccountRow | null) ?? null;
}

function tokenExpiryIso(token: MercadoPagoTokenResponse): string {
	const ms = Date.now() + Math.max(60, token.expires_in - 120) * 1000;
	return new Date(ms).toISOString();
}

export async function upsertMercadoPagoAccount(
	gymId: string,
	token: MercadoPagoTokenResponse
): Promise<{ ok: true } | { ok: false; message: string }> {
	const admin = createServiceRoleClient();
	if (!admin) return { ok: false, message: 'Missing service role' };

	const { error } = await admin.from('gym_payment_accounts').upsert(
		{
			gym_id: gymId,
			provider: 'MERCADOPAGO',
			status: 'CONNECTED',
			external_user_id: String(token.user_id),
			access_token: token.access_token,
			refresh_token: token.refresh_token,
			token_expires_at: tokenExpiryIso(token),
			public_key: token.public_key ?? null,
			live_mode: token.live_mode ?? true,
			connected_at: new Date().toISOString(),
			disconnected_at: null,
			last_error: null,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'gym_id,provider' }
	);

	if (error) {
		console.error('upsertMercadoPagoAccount', error.message);
		return { ok: false, message: error.message };
	}
	return { ok: true };
}

export async function disconnectMercadoPagoAccount(
	gymId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
	const admin = createServiceRoleClient();
	if (!admin) return { ok: false, message: 'Missing service role' };

	const { error } = await admin
		.from('gym_payment_accounts')
		.update({
			status: 'DISCONNECTED',
			access_token: null,
			refresh_token: null,
			token_expires_at: null,
			disconnected_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq('gym_id', gymId)
		.eq('provider', 'MERCADOPAGO');

	if (error) {
		console.error('disconnectMercadoPagoAccount', error.message);
		return { ok: false, message: error.message };
	}
	return { ok: true };
}

/**
 * Returns a valid access token, refreshing when near expiry.
 */
export async function getValidMercadoPagoAccessToken(
	gymId: string
): Promise<{ ok: true; accessToken: string } | { ok: false; message: string }> {
	const account = await loadGymPaymentAccount(gymId, 'MERCADOPAGO');
	if (!account || account.status !== 'CONNECTED' || !account.access_token) {
		return { ok: false, message: 'Mercado Pago is not connected' };
	}

	const expiresAt = account.token_expires_at
		? new Date(account.token_expires_at).getTime()
		: 0;
	const needsRefresh = !expiresAt || expiresAt < Date.now() + 60_000;

	if (!needsRefresh) {
		return { ok: true, accessToken: account.access_token };
	}

	if (!account.refresh_token) {
		return { ok: false, message: 'Mercado Pago session expired — reconnect' };
	}

	const refreshed = await refreshMercadoPagoToken(account.refresh_token);
	if (!refreshed.ok) {
		const admin = createServiceRoleClient();
		await admin
			?.from('gym_payment_accounts')
			.update({
				status: 'ERROR',
				last_error: refreshed.message,
				updated_at: new Date().toISOString()
			})
			.eq('id', account.id);
		return { ok: false, message: refreshed.message };
	}

	const saved = await upsertMercadoPagoAccount(gymId, refreshed.token);
	if (!saved.ok) return saved;
	return { ok: true, accessToken: refreshed.token.access_token };
}

/** Push AMRAP active plans as enabled online links for Mercado Pago. */
export async function syncMercadoPagoPlans(
	gymId: string
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
	const token = await getValidMercadoPagoAccessToken(gymId);
	if (!token.ok) return token;

	const admin = createServiceRoleClient();
	if (!admin) return { ok: false, message: 'Missing service role' };

	const { data: plans, error } = await admin
		.from('plans')
		.select('id, name, price')
		.eq('gym_id', gymId)
		.eq('is_active', true);

	if (error) {
		console.error('syncMercadoPagoPlans plans', error.message);
		return { ok: false, message: error.message };
	}

	const now = new Date().toISOString();
	const rows = (plans ?? []).map((p) => ({
		gym_id: gymId,
		plan_id: p.id,
		provider: 'MERCADOPAGO' as const,
		external_product_id: p.id,
		external_price_id: String(p.price),
		is_enabled: true,
		synced_at: now,
		updated_at: now
	}));

	if (rows.length === 0) {
		return { ok: true, count: 0 };
	}

	const { error: upsertErr } = await admin.from('plan_payment_links').upsert(rows, {
		onConflict: 'plan_id,provider'
	});

	if (upsertErr) {
		console.error('syncMercadoPagoPlans upsert', upsertErr.message);
		return { ok: false, message: upsertErr.message };
	}

	return { ok: true, count: rows.length };
}
