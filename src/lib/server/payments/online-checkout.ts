import {
	computeRenewedExpiry,
	memberStatusFromExpires
} from '$lib/members/dates';
import { createMercadoPagoPreference } from '$lib/payments/mercadopago/client';
import { getValidMercadoPagoAccessToken } from '$lib/server/payments/gateway-accounts';
import { createServiceRoleClient } from '$lib/supabase/admin';
import { getRequestOrigin } from '$lib/http/origin';
import type { Locale } from '$lib/i18n/config';

export type CreateOnlineCheckoutInput = {
	locale: Locale;
	gymId: string;
	membershipId: string;
	planId: string;
	createdBy: string | null;
	payerEmail?: string | null;
	/** Where MP redirects after pay (success/failure/pending share base). */
	returnPath: string;
};

export type CreateOnlineCheckoutResult =
	| { ok: true; checkoutId: string; initPoint: string }
	| { ok: false; message: string; code?: 'not_connected' | 'plan_disabled' | 'forbidden' | 'error' };

/**
 * Creates a Mercado Pago Checkout Pro preference and a PENDING payment_checkouts row.
 */
export async function createMercadoPagoCheckout(
	input: CreateOnlineCheckoutInput
): Promise<CreateOnlineCheckoutResult> {
	const admin = createServiceRoleClient();
	if (!admin) return { ok: false, message: 'Server misconfigured', code: 'error' };

	const token = await getValidMercadoPagoAccessToken(input.gymId);
	if (!token.ok) {
		return { ok: false, message: token.message, code: 'not_connected' };
	}

	const { data: membership } = await admin
		.from('memberships')
		.select('id, gym_id, expires_at, plan_id')
		.eq('id', input.membershipId)
		.eq('gym_id', input.gymId)
		.maybeSingle();

	if (!membership) {
		return { ok: false, message: 'Membership not found', code: 'forbidden' };
	}

	const { data: plan } = await admin
		.from('plans')
		.select('id, name, price, duration_days, is_active')
		.eq('id', input.planId)
		.eq('gym_id', input.gymId)
		.eq('is_active', true)
		.maybeSingle();

	if (!plan) {
		return { ok: false, message: 'Plan not found', code: 'error' };
	}

	const { data: link } = await admin
		.from('plan_payment_links')
		.select('id, is_enabled')
		.eq('plan_id', plan.id)
		.eq('provider', 'MERCADOPAGO')
		.eq('is_enabled', true)
		.maybeSingle();

	if (!link) {
		return {
			ok: false,
			message: 'Plan is not enabled for online billing — sync plans first',
			code: 'plan_disabled'
		};
	}

	const amount = Number(plan.price);
	if (!(amount > 0)) {
		return { ok: false, message: 'Plan price must be greater than zero', code: 'error' };
	}

	const { data: checkout, error: insertErr } = await admin
		.from('payment_checkouts')
		.insert({
			gym_id: input.gymId,
			membership_id: membership.id,
			plan_id: plan.id,
			provider: 'MERCADOPAGO',
			amount,
			list_amount: amount,
			status: 'PENDING',
			created_by: input.createdBy,
			metadata: { locale: input.locale }
		})
		.select('id')
		.single();

	if (insertErr || !checkout) {
		console.error('createMercadoPagoCheckout insert', insertErr?.message);
		return { ok: false, message: insertErr?.message ?? 'Checkout insert failed', code: 'error' };
	}

	const origin = getRequestOrigin();
	const returnBase = `${origin}${input.returnPath}${input.returnPath.includes('?') ? '&' : '?'}checkout=${checkout.id}`;
	const notificationUrl = `${origin}/api/mercadopago/webhook`;

	const preference = await createMercadoPagoPreference({
		accessToken: token.accessToken,
		title: plan.name,
		quantity: 1,
		unitPrice: amount,
		externalReference: checkout.id,
		notificationUrl,
		backUrls: {
			success: `${returnBase}&billing=success`,
			failure: `${returnBase}&billing=failure`,
			pending: `${returnBase}&billing=pending`
		},
		payerEmail: input.payerEmail
	});

	if (!preference.ok) {
		await admin
			.from('payment_checkouts')
			.update({ status: 'FAILED', completed_at: new Date().toISOString() })
			.eq('id', checkout.id);
		return { ok: false, message: preference.message, code: 'error' };
	}

	const initPoint =
		preference.preference.init_point || preference.preference.sandbox_init_point;
	if (!initPoint) {
		return { ok: false, message: 'No checkout URL from Mercado Pago', code: 'error' };
	}

	await admin
		.from('payment_checkouts')
		.update({
			provider_preference_id: preference.preference.id,
			init_point: initPoint
		})
		.eq('id', checkout.id);

	return { ok: true, checkoutId: checkout.id, initPoint };
}

/**
 * Idempotent fulfillment when MP reports approved payment.
 */
export async function fulfillCheckoutFromMercadoPagoPayment(opts: {
	checkoutId: string;
	providerPaymentId: string;
	paidAmount?: number;
}): Promise<{ ok: true; already?: boolean } | { ok: false; message: string }> {
	const admin = createServiceRoleClient();
	if (!admin) return { ok: false, message: 'Missing service role' };

	const { data: existingPay } = await admin
		.from('payments')
		.select('id')
		.eq('provider', 'MERCADOPAGO')
		.eq('provider_payment_id', opts.providerPaymentId)
		.maybeSingle();

	if (existingPay) {
		return { ok: true, already: true };
	}

	const { data: checkout } = await admin
		.from('payment_checkouts')
		.select(
			'id, gym_id, membership_id, plan_id, amount, list_amount, status, provider_payment_id'
		)
		.eq('id', opts.checkoutId)
		.maybeSingle();

	if (!checkout) {
		return { ok: false, message: 'Checkout not found' };
	}

	if (checkout.status === 'SUCCEEDED') {
		return { ok: true, already: true };
	}

	const { data: membership } = await admin
		.from('memberships')
		.select('id, expires_at, plan_id')
		.eq('id', checkout.membership_id)
		.maybeSingle();

	const { data: plan } = await admin
		.from('plans')
		.select('id, duration_days')
		.eq('id', checkout.plan_id)
		.maybeSingle();

	if (!membership || !plan) {
		return { ok: false, message: 'Membership or plan missing' };
	}

	const amount =
		opts.paidAmount != null && Number.isFinite(opts.paidAmount)
			? Number(opts.paidAmount)
			: Number(checkout.amount);

	const newExpires = computeRenewedExpiry(
		new Date(membership.expires_at),
		plan.duration_days
	);
	const status = memberStatusFromExpires(newExpires);

	const { data: payment, error: payErr } = await admin
		.from('payments')
		.insert({
			gym_id: checkout.gym_id,
			membership_id: checkout.membership_id,
			amount,
			list_amount: Number(checkout.list_amount),
			method: 'ONLINE',
			kind: 'PLAN',
			plan_id: checkout.plan_id,
			provider: 'MERCADOPAGO',
			provider_payment_id: opts.providerPaymentId,
			checkout_id: checkout.id,
			recorded_by: null
		})
		.select('id')
		.single();

	if (payErr || !payment) {
		// Race: unique provider_payment_id
		if (payErr?.code === '23505') return { ok: true, already: true };
		console.error('fulfillCheckout payment', payErr?.message);
		return { ok: false, message: payErr?.message ?? 'Payment insert failed' };
	}

	const { error: memErr } = await admin
		.from('memberships')
		.update({
			expires_at: newExpires.toISOString(),
			status,
			plan_id: checkout.plan_id
		})
		.eq('id', membership.id);

	if (memErr) {
		console.error('fulfillCheckout membership', memErr.message);
		return { ok: false, message: memErr.message };
	}

	await admin
		.from('payment_checkouts')
		.update({
			status: 'SUCCEEDED',
			provider_payment_id: opts.providerPaymentId,
			completed_at: new Date().toISOString()
		})
		.eq('id', checkout.id);

	return { ok: true };
}
