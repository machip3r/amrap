import { error, redirect } from '@sveltejs/kit';
import { getMemberContext } from '$lib/auth/member-session';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { needsOwnerOnboarding } from '$lib/auth/post-auth-redirect';
import { needsProfileWelcome, welcomePath } from '$lib/auth/profile-onboarding';
import { canInWorkspace } from '$lib/auth/permissions';
import { getOnboardingState, getWorkspace } from '$lib/auth/session';
import { brandThemeCssVars } from '$lib/branding/theme';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { canUseWhitelabel } from '$lib/plans/limits';
import { createClient } from '$lib/supabase/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;

	if (await getPendingInvite()) {
		throw redirect(303, invitePath(locale));
	}

	const onboarding = await getOnboardingState();
	if (await needsOwnerOnboarding(onboarding)) {
		throw redirect(303, `/${locale}/onboarding`);
	}

	if (await needsProfileWelcome()) {
		throw redirect(303, welcomePath(locale));
	}

	const workspace = await getWorkspace();
	if (!workspace) {
		const member = await getMemberContext();
		if (member) throw redirect(303, `/${locale}/me`);
		throw redirect(303, `/${locale}/onboarding`);
	}

	const d = getDictionary(locale);
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

	const supabase = createClient();
	const { data: personRow } = await supabase
		.from('persons')
		.select('qr_code')
		.eq('id', workspace.personId)
		.maybeSingle();
	const qrCode = personRow?.qr_code ?? null;

	return {
		locale,
		d,
		workspace,
		initial,
		canManageSettings,
		canManageStaff,
		brandStyle,
		logoUrlLight,
		logoUrlDark,
		qrCode
	};
};
