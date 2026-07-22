import { getPendingInvite } from '$lib/auth/invite-decision';
import { getMemberContext } from '$lib/auth/member-session';
import { getSessionUser, getWorkspace } from '$lib/auth/session';
import { gymLogoPublicUrl } from '$lib/branding/logo';
import { brandThemeStyleBlock, parseBrandThemeTokens } from '$lib/branding/theme';
import { canUseWhitelabel } from '$lib/plans/limits';
import { createServiceRoleClient } from '$lib/supabase/admin';
import { createClient } from '$lib/supabase/server';
import type { BrandThemeTokens, OrgPlanTier } from '$lib/types';

export type AuthShellBrand = {
	gymName: string;
	organizationName: string;
	documentBrand: string;
	planTier: OrgPlanTier;
	brandStyle: string;
	logoUrlLight: string | null;
	logoUrlDark: string | null;
};

type GymBrandRow = {
	id: string;
	name: string;
	updated_at: string | null;
	logo_url_light: string | null;
	logo_url_dark: string | null;
	theme_light: unknown;
	theme_dark: unknown;
	organizations:
		| { id: string; name: string; plan_tier: OrgPlanTier }
		| { id: string; name: string; plan_tier: OrgPlanTier }[]
		| null;
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

function db() {
	return createServiceRoleClient() ?? createClient();
}

/**
 * Gym branding for invite / password / welcome chrome when the org plan
 * includes white-label (Starter+). Uses service role so pending invitees can
 * read logos/theme before accept.
 */
export async function getAuthShellBrandForGym(
	gymId: string
): Promise<AuthShellBrand | null> {
	const id = gymId.trim();
	if (!id) return null;

	const supabase = db();
	const { data, error } = await supabase
		.from('gyms')
		.select(
			`
      id,
      name,
      updated_at,
      logo_url_light,
      logo_url_dark,
      theme_light,
      theme_dark,
      organizations (
        id,
        name,
        plan_tier
      )
    `
		)
		.eq('id', id)
		.maybeSingle();

	if (error) {
		console.error('getAuthShellBrandForGym', error.message);
		return null;
	}
	if (!data) return null;

	const row = data as unknown as GymBrandRow;
	const org = firstEmbed(row.organizations);
	const planTier = org?.plan_tier ?? 'FREEMIUM';
	if (!canUseWhitelabel(planTier)) return null;

	const themeLight: BrandThemeTokens = parseBrandThemeTokens(row.theme_light);
	const themeDark: BrandThemeTokens = parseBrandThemeTokens(row.theme_dark);
	const cacheKey = row.updated_at ?? null;
	const lightPath = row.logo_url_light ?? row.logo_url_dark ?? null;
	const darkPath = row.logo_url_dark ?? row.logo_url_light ?? null;
	const gymName = row.name?.trim() || '';
	const organizationName = org?.name?.trim() || '';
	const documentBrand = gymName || organizationName || 'AMRAP';

	return {
		gymName,
		organizationName,
		documentBrand,
		planTier,
		brandStyle: brandThemeStyleBlock(themeLight, themeDark),
		logoUrlLight: gymLogoPublicUrl(lightPath, cacheKey),
		logoUrlDark: gymLogoPublicUrl(darkPath, cacheKey)
	};
}

/**
 * Gym id for invite → password → welcome: pending invite, then ops workspace,
 * then member context, then any accepted membership.
 */
export async function resolveInviteFlowGymId(): Promise<string | null> {
	const pending = await getPendingInvite();
	if (pending?.gymId) return pending.gymId;

	const workspace = await getWorkspace();
	if (workspace?.gymId) return workspace.gymId;

	const member = await getMemberContext();
	if (member?.activeGymId) return member.activeGymId;

	const user = await getSessionUser();
	if (!user) return null;

	const supabase = db();
	const { data: person } = await supabase
		.from('persons')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();
	if (!person) return null;

	const { data: membership } = await supabase
		.from('memberships')
		.select('gym_id')
		.eq('person_id', person.id)
		.eq('invite_status', 'accepted')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	return (membership?.gym_id as string | undefined) ?? null;
}

export async function resolveInviteFlowBrand(): Promise<AuthShellBrand | null> {
	const gymId = await resolveInviteFlowGymId();
	if (!gymId) return null;
	return getAuthShellBrandForGym(gymId);
}
