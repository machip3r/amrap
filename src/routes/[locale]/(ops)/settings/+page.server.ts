import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { canUseCustomDomain, canUseWhitelabel } from '$lib/plans/limits';
import {
	applyPaletteTemplateAction,
	removeGymLogoAction,
	saveNavVisibilityAction,
	uploadGymLogoAction,
	type SettingsActionState
} from '$lib/server/settings/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, depends }) => {
	depends(OPS_LOAD_DEPS.branding);
	depends(OPS_LOAD_DEPS.workspace);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/onboarding`);

	const canManageGymBrand = canInWorkspace(workspace, 'manage_billing');
	const canManageStaff = canInWorkspace(workspace, 'manage_staff');
	const navRole = workspace.canActAsOwner ? 'OWNER' : workspace.role;

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
		canUseCustomDomain: canUseCustomDomain(workspace.planTier)
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
		removeGymLogoAction(await request.formData()) as SettingsActionState
} satisfies Actions;
