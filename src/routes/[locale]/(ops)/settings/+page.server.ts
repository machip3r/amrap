import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { canUseCustomDomain, canUseOnlineBilling, canUseWhitelabel } from '$lib/plans/limits';
import { isMercadoPagoConfigured } from '$lib/payments/mercadopago/env';
import {
	disconnectOnlineGatewayAction,
	syncOnlinePlansAction,
	type GatewayActionState
} from '$lib/server/payments/gateway-actions';
import {
	loadGymPaymentAccount,
	toPublicAccount
} from '$lib/server/payments/gateway-accounts';
import {
	applyPaletteTemplateAction,
	removeGymLogoAction,
	saveNavVisibilityAction,
	uploadGymLogoAction,
	type SettingsActionState
} from '$lib/server/settings/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, depends, url }) => {
	depends(OPS_LOAD_DEPS.branding);
	depends(OPS_LOAD_DEPS.workspace);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/onboarding`);

	const canManageGymBrand = canInWorkspace(workspace, 'manage_billing');
	const canManageStaff = canInWorkspace(workspace, 'manage_staff');
	const navRole = workspace.canActAsOwner ? 'OWNER' : workspace.role;
	const onlineBillingAllowed = canUseOnlineBilling(workspace.planTier);

	let gatewayAccount = null;
	if (canManageGymBrand && onlineBillingAllowed) {
		const row = await loadGymPaymentAccount(workspace.gymId, 'MERCADOPAGO');
		let enabledPlanCount = 0;
		if (row?.status === 'CONNECTED') {
			const supabase = createClient();
			const { count } = await supabase
				.from('plan_payment_links')
				.select('id', { count: 'exact', head: true })
				.eq('gym_id', workspace.gymId)
				.eq('provider', 'MERCADOPAGO')
				.eq('is_enabled', true);
			enabledPlanCount = count ?? 0;
		}
		gatewayAccount = row ? toPublicAccount(row, enabledPlanCount) : null;
	}

	const gatewayParam = url.searchParams.get('gateway');
	const gatewayFlashMap: Record<string, string> = {
		connected: d.settings.gatewayFlashConnected,
		denied: d.settings.gatewayFlashDenied,
		error: d.settings.gatewayFlashError,
		upgrade: d.settings.gatewayFlashUpgrade,
		forbidden: d.settings.gatewayFlashForbidden,
		not_configured: d.settings.gatewayFlashNotConfigured
	};
	const gatewayFlash =
		gatewayParam && gatewayFlashMap[gatewayParam] ? gatewayFlashMap[gatewayParam] : null;

	return {
		locale: locale as Locale,
		d,
		canManageGymBrand,
		canManageStaff,
		navRole,
		hiddenNavIds: workspace.hiddenNavIds,
		logoUrlLight: workspace.logoUrlLight,
		logoUrlDark: workspace.logoUrlDark,
		canCustomizeBrand: canUseWhitelabel(workspace.planTier),
		canUseCustomDomain: canUseCustomDomain(workspace.planTier),
		canActAsOwner: workspace.canActAsOwner,
		canUseOnlineBilling: onlineBillingAllowed,
		mpConfigured: isMercadoPagoConfigured(),
		gatewayAccount,
		gatewayFlash
	};
};

export const actions = {
	saveNav: async ({ request }) =>
		saveNavVisibilityAction(await request.formData()) as SettingsActionState,
	applyPalette: async ({ request }) =>
		applyPaletteTemplateAction(await request.formData()) as SettingsActionState,
	uploadLogo: async ({ request }) =>
		uploadGymLogoAction(await request.formData()) as SettingsActionState,
	removeLogo: async ({ request }) =>
		removeGymLogoAction(await request.formData()) as SettingsActionState,
	syncGateway: async ({ request }) =>
		syncOnlinePlansAction(await request.formData()) as GatewayActionState,
	disconnectGateway: async ({ request }) =>
		disconnectOnlineGatewayAction(await request.formData()) as GatewayActionState
} satisfies Actions;
