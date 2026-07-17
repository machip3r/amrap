import { error, redirect } from '@sveltejs/kit';
import { getMemberContext } from '$lib/auth/member-session';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { needsOwnerOnboarding } from '$lib/auth/post-auth-redirect';
import { getPersonProfileStatus, welcomePath } from '$lib/auth/profile-onboarding';
import { canInWorkspace } from '$lib/auth/permissions';
import { getOnboardingState, getWorkspace } from '$lib/auth/session';
import { brandThemeCssVars } from '$lib/branding/theme';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { canUseWhitelabel } from '$lib/plans/limits';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, depends }) => {
	depends(OPS_LOAD_DEPS.workspace);

	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;

	// Fetch gates + workspace together so login→dashboard is one DB round, not
	// gates-then-workspace (workspace is already memoized / in-flight-deduped).
	const [invite, onboarding, profile, workspace] = await Promise.all([
		getPendingInvite(),
		getOnboardingState(),
		getPersonProfileStatus(),
		getWorkspace()
	]);

	if (invite) {
		throw redirect(303, invitePath(locale));
	}

	if (await needsOwnerOnboarding(onboarding)) {
		throw redirect(303, `/${locale}/onboarding`);
	}

	if (profile && !profile.profileCompleted) {
		if (workspace || (await getMemberContext())) {
			throw redirect(303, welcomePath(locale));
		}
	}

	if (!workspace) {
		const member = await getMemberContext();
		if (member) throw redirect(303, `/${locale}/me`);
		throw redirect(303, `/${locale}/onboarding`);
	}

	const initial =
		workspace.fullName?.charAt(0).toUpperCase() ||
		workspace.userId.slice(0, 2).toUpperCase();

	const canManageSettings = canInWorkspace(workspace, 'manage_billing');
	const canManageStaff = canInWorkspace(workspace, 'manage_staff');

	const allowBrand = canUseWhitelabel(workspace.planTier);
	const { light, dark } = brandThemeCssVars(
		allowBrand ? workspace.themeLight : {},
		allowBrand ? workspace.themeDark : {}
	);
	const lightDecls = Object.entries(light)
		.map(([k, v]) => `${k}:${v}`)
		.join(';');
	const darkDecls = Object.entries(dark)
		.map(([k, v]) => `${k}:${v}`)
		.join(';');
	const brandStyle = `.amrap-branded{${lightDecls}}.dark .amrap-branded{${darkDecls}}`;

	const logoUrlLight = allowBrand ? workspace.logoUrlLight : null;
	const logoUrlDark = allowBrand ? workspace.logoUrlDark : null;

	return {
		locale,
		workspace,
		initial,
		canManageSettings,
		canManageStaff,
		brandStyle,
		logoUrlLight,
		logoUrlDark,
		qrCode: workspace.qrCode
	};
};
