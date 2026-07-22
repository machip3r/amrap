import { error, redirect } from '@sveltejs/kit';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { noAccessPath } from '$lib/auth/post-auth-redirect';
import { needsProfileWelcome, welcomePath } from '$lib/auth/profile-onboarding';
import { getMemberContext } from '$lib/auth/member-session';
import { getAuthShellBrandForGym } from '$lib/branding/auth-shell';
import { brandThemeStyleBlock, parseBrandThemeTokens } from '$lib/branding/theme';
import { gymLogoPublicUrl } from '$lib/branding/logo';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { canUseWhitelabel, showAmrapWatermark } from '$lib/plans/limits';
import { createClient } from '$lib/supabase/server';
import type { BrandThemeTokens, OrgPlanTier } from '$lib/types';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;

	const member = await getMemberContext();
	if (!member) throw redirect(303, noAccessPath(locale));

	if (await getPendingInvite()) throw redirect(303, invitePath(locale));
	if (await needsProfileWelcome()) throw redirect(303, welcomePath(locale));

	const d = getDictionary(locale);
	const initial =
		member.fullName?.charAt(0).toUpperCase() ?? member.userId.slice(0, 2).toUpperCase();

	const [shellBrand, gymResult] = await Promise.all([
		getAuthShellBrandForGym(member.activeGymId),
		createClient()
			.from('gyms')
			.select(
				'name, logo_url_light, logo_url_dark, theme_light, theme_dark, updated_at, organizations ( plan_tier, name )'
			)
			.eq('id', member.activeGymId)
			.maybeSingle()
	]);

	const gym = gymResult.data;
	const org = gym?.organizations;
	const orgRow = Array.isArray(org) ? org[0] : org;
	const planTier: OrgPlanTier =
		shellBrand?.planTier ?? (orgRow?.plan_tier as OrgPlanTier | undefined) ?? 'FREEMIUM';
	const allowBrand = canUseWhitelabel(planTier);

	const gymName =
		shellBrand?.gymName ||
		member.gyms.find((g) => g.gymId === member.activeGymId)?.gymName ||
		gym?.name?.trim() ||
		'';
	const organizationName =
		shellBrand?.organizationName || (orgRow?.name as string | undefined)?.trim() || '';

	const updatedAt = (gym?.updated_at as string | null) ?? null;
	const themeLight = allowBrand
		? parseBrandThemeTokens(gym?.theme_light as BrandThemeTokens | null)
		: {};
	const themeDark = allowBrand
		? parseBrandThemeTokens(gym?.theme_dark as BrandThemeTokens | null)
		: {};

	const brandStyle = shellBrand?.brandStyle ?? brandThemeStyleBlock(themeLight, themeDark);
	const logoUrlLight =
		shellBrand?.logoUrlLight ??
		(allowBrand ? gymLogoPublicUrl(gym?.logo_url_light as string | null, updatedAt) : null);
	const logoUrlDark =
		shellBrand?.logoUrlDark ??
		(allowBrand ? gymLogoPublicUrl(gym?.logo_url_dark as string | null, updatedAt) : null);
	const documentBrand = allowBrand
		? shellBrand?.documentBrand || gymName.trim() || organizationName.trim() || null
		: null;

	return {
		locale,
		d,
		member,
		initial,
		gymName,
		organizationName,
		planTier,
		showWatermark: showAmrapWatermark(planTier),
		brandStyle,
		logoUrlLight,
		logoUrlDark,
		allowBrand,
		documentBrand,
		qrCode: member.qrCode
	};
};
