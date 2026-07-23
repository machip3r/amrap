import { error, redirect } from '@sveltejs/kit';
import { listUserIdentities, pickActiveIdentity } from '$lib/auth/identities';
import { getMemberContext } from '$lib/auth/member-session';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { needsOwnerOnboarding, noAccessPath } from '$lib/auth/post-auth-redirect';
import { getPersonProfileStatus, welcomePath } from '$lib/auth/profile-onboarding';
import { canInWorkspace } from '$lib/auth/permissions';
import { getOnboardingState, getWorkspace } from '$lib/auth/session';
import { brandThemeStyleBlock } from '$lib/branding/theme';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { canUseWhitelabel } from '$lib/plans/limits';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, depends }) => {
	depends(OPS_LOAD_DEPS.workspace);

	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;

	const [invite, onboarding, profile, workspace, member, identities] = await Promise.all([
		getPendingInvite(),
		getOnboardingState(),
		getPersonProfileStatus(),
		getWorkspace(),
		getMemberContext(),
		listUserIdentities()
	]);

	if (invite) {
		throw redirect(303, invitePath(locale));
	}

	if (await needsOwnerOnboarding(onboarding)) {
		throw redirect(303, `/${locale}/onboarding`);
	}

	if (profile && !profile.profileCompleted) {
		if (workspace || member) {
			throw redirect(303, welcomePath(locale));
		}
	}

	if (!workspace) {
		if (member) throw redirect(303, `/${locale}/me`);
		throw redirect(303, noAccessPath(locale));
	}

	const initial =
		workspace.fullName?.charAt(0).toUpperCase() ||
		workspace.userId.slice(0, 2).toUpperCase();

	const canManageSettings = canInWorkspace(workspace, 'manage_billing');
	const canManageStaff = canInWorkspace(workspace, 'manage_staff');

	const allowBrand = canUseWhitelabel(workspace.planTier);
	const brandStyle = brandThemeStyleBlock(
		allowBrand ? workspace.themeLight : {},
		allowBrand ? workspace.themeDark : {}
	);

	const logoUrlLight = allowBrand ? workspace.logoUrlLight : null;
	const logoUrlDark = allowBrand ? workspace.logoUrlDark : null;
	const documentBrand = allowBrand
		? workspace.gymName.trim() || workspace.organizationName.trim() || null
		: null;

	const activeIdentity =
		pickActiveIdentity(identities.filter((i) => i.kind === 'ops' || i.kind === 'member')) ??
		identities.find((i) => i.kind === 'ops' && i.gymId === workspace.gymId) ??
		null;

	const activeId =
		activeIdentity?.kind === 'ops' && activeIdentity.gymId === workspace.gymId
			? activeIdentity.id
			: `ops:${workspace.gymId}`;

	return {
		locale,
		workspace,
		initial,
		canManageSettings,
		canManageStaff,
		brandStyle,
		logoUrlLight,
		logoUrlDark,
		allowBrand,
		documentBrand,
		qrCode: workspace.qrCode,
		identities,
		activeIdentityId: activeId
	};
};
