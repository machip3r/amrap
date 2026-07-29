import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { formString, localeSchema } from '$lib/validation/schemas';
import { getDictionary } from '$lib/i18n/dictionaries';
import { canUseOnlineBilling } from '$lib/plans/limits';
import {
	disconnectMercadoPagoAccount,
	syncMercadoPagoPlans
} from '$lib/server/payments/gateway-accounts';
import { createMercadoPagoCheckout } from '$lib/server/payments/online-checkout';
import { createClient } from '$lib/supabase/server';
import { uuidSchema } from '$lib/validation/schemas';

function localeFrom(formData: FormData) {
	const raw = formString(formData, 'locale') || 'es';
	const parsed = localeSchema.safeParse(raw);
	return parsed.success ? parsed.data : ('es' as const);
}

export type GatewayActionState = {
	error?: string;
	success?: string;
	syncedCount?: number;
} | null;

export async function syncOnlinePlansAction(
	formData: FormData
): Promise<GatewayActionState> {
	const locale = localeFrom(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return { error: d.common.forbidden };
	}
	if (!canUseOnlineBilling(workspace.planTier)) {
		return { error: d.settings.gatewayUpgradeRequired };
	}

	const result = await syncMercadoPagoPlans(workspace.gymId);
	if (!result.ok) {
		return { error: result.message || d.settings.gatewaySyncError };
	}
	return {
		success: d.settings.gatewaySyncSuccess.replace('{count}', String(result.count)),
		syncedCount: result.count
	};
}

export async function disconnectOnlineGatewayAction(
	formData: FormData
): Promise<GatewayActionState> {
	const locale = localeFrom(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return { error: d.common.forbidden };
	}

	const result = await disconnectMercadoPagoAccount(workspace.gymId);
	if (!result.ok) return { error: result.message || d.settings.gatewayError };
	return { success: d.settings.gatewayDisconnected };
}

/**
 * Ops: create MP checkout for a membership + plan, redirect to init_point.
 */
export async function startOnlineCheckoutAction(formData: FormData): Promise<GatewayActionState> {
	const locale = localeFrom(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'record_payment')) {
		return { error: d.common.forbidden };
	}
	if (!canUseOnlineBilling(workspace.planTier)) {
		return { error: d.settings.gatewayUpgradeRequired };
	}

	const membershipId = uuidSchema.safeParse(formString(formData, 'member_id'));
	const planId = uuidSchema.safeParse(formString(formData, 'plan_id'));
	if (!membershipId.success || !planId.success) {
		return { error: d.common.invalidInput };
	}

	const supabase = createClient();
	const { data: person } = await supabase
		.from('memberships')
		.select('id, persons(email)')
		.eq('id', membershipId.data)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();

	const email =
		person &&
		typeof person.persons === 'object' &&
		person.persons &&
		'email' in person.persons
			? ((person.persons as { email: string | null }).email ?? null)
			: null;

	const checkout = await createMercadoPagoCheckout({
		locale,
		gymId: workspace.gymId,
		membershipId: membershipId.data,
		planId: planId.data,
		createdBy: workspace.userId,
		payerEmail: email,
		returnPath: `/${locale}/members/${membershipId.data}`
	});

	if (!checkout.ok) {
		if (checkout.code === 'not_connected') return { error: d.settings.gatewayNotConnected };
		if (checkout.code === 'plan_disabled') return { error: d.settings.gatewayPlanDisabled };
		return { error: checkout.message || d.settings.gatewayCheckoutError };
	}

	throw redirect(303, checkout.initPoint);
}
