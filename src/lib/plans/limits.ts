import type { OrgPlanTier } from '$lib/types';

/** Max active membership plans per gym. `null` = unlimited. */
export function maxActivePlans(tier: OrgPlanTier): number | null {
	switch (tier) {
		case 'FREEMIUM':
			return 2;
		default:
			return null;
	}
}

export function canCreatePlan(tier: OrgPlanTier, activePlanCount: number): boolean {
	const max = maxActivePlans(tier);
	if (max == null) return true;
	return activePlanCount < max;
}

/**
 * Active-member cap per gym.
 * Freemium = hard block. Starter/Growth = soft (warn, never block check-in / create).
 * `null` = unlimited (Pro).
 */
export function maxActiveMembers(tier: OrgPlanTier): number | null {
	switch (tier) {
		case 'FREEMIUM':
			return 30;
		case 'STARTER':
		case 'GROWTH':
			return 500;
		case 'PRO':
			return null;
		default:
			return 30;
	}
}

/** Freemium hard-stops new active members; paid soft-caps only warn. */
export function isHardMemberCap(tier: OrgPlanTier): boolean {
	return tier === 'FREEMIUM';
}

/**
 * Max gyms per organization for self-serve / product caps.
 * Growth = Multi-Gym flat (2–3). Pro = custom (agreement).
 */
export function maxGyms(tier: OrgPlanTier): number | null {
	switch (tier) {
		case 'FREEMIUM':
		case 'STARTER':
			return 1;
		case 'GROWTH':
			return 3;
		case 'PRO':
			return null;
		default:
			return 1;
	}
}

export function canCreateGym(tier: OrgPlanTier, gymCount: number): boolean {
	const max = maxGyms(tier);
	if (max == null) return true;
	return gymCount < max;
}

/**
 * Max STAFF + TRAINER seats **per gym** (OWNER does not count).
 * Growth ≈ 5/gym → up to 15 across 3 gyms. `null` = unlimited (Pro).
 */
export function maxStaffSeats(tier: OrgPlanTier): number | null {
	switch (tier) {
		case 'FREEMIUM':
			return 2;
		case 'STARTER':
		case 'GROWTH':
			return 5;
		case 'PRO':
			return null;
		default:
			return 2;
	}
}

/** Illustrative org-wide staff ceiling when every gym is at the per-gym max. */
export function maxStaffSeatsOrgHint(tier: OrgPlanTier): number | null {
	const perGym = maxStaffSeats(tier);
	const gyms = maxGyms(tier);
	if (perGym == null) return null;
	if (gyms == null) return null;
	return perGym * gyms;
}

export function canInviteStaff(
	tier: OrgPlanTier,
	currentStaffAndTrainerCount: number
): boolean {
	const max = maxStaffSeats(tier);
	if (max == null) return true;
	return currentStaffAndTrainerCount < max;
}

/** Logo + theme colors (Starter+). Freemium keeps AMRAP branding. */
export function canUseWhitelabel(tier: OrgPlanTier): boolean {
	return tier !== 'FREEMIUM';
}

/**
 * Full white-label (custom domain / advanced branding) — Growth & Pro.
 * Feature may still be Beta / coming soon in UI.
 */
export function canUseCustomDomain(tier: OrgPlanTier): boolean {
	return tier === 'GROWTH' || tier === 'PRO';
}

/** Footer “Powered by AMRAP” — hidden on Growth / Pro. */
export function showAmrapWatermark(tier: OrgPlanTier): boolean {
	return tier !== 'GROWTH' && tier !== 'PRO';
}

/** Relative rank for upgrade vs change/downgrade CTAs. */
export const PLAN_TIER_RANK: Record<OrgPlanTier, number> = {
	FREEMIUM: 0,
	STARTER: 1,
	GROWTH: 2,
	PRO: 3
};

export function isPlanDowngrade(from: OrgPlanTier, to: OrgPlanTier): boolean {
	return PLAN_TIER_RANK[to] < PLAN_TIER_RANK[from];
}

export const ORG_DELETION_RETENTION_DAYS = 30;

export type AmrapPlanOption = {
	tier: OrgPlanTier;
	priceMxnMonthly: number | null;
	priceUsdMonthly: number | null;
	priceNote: 'free' | 'per_org' | 'per_gym' | 'contact';
};

/** List prices. Starter sits in the $799–$899 MXN / ~$42 USD band. */
export const AMRAP_PLANS: AmrapPlanOption[] = [
	{
		tier: 'FREEMIUM',
		priceMxnMonthly: 0,
		priceUsdMonthly: 0,
		priceNote: 'free'
	},
	{
		tier: 'STARTER',
		priceMxnMonthly: 849,
		priceUsdMonthly: 42,
		priceNote: 'per_org'
	},
	{
		tier: 'GROWTH',
		priceMxnMonthly: 1499,
		priceUsdMonthly: 73,
		priceNote: 'per_org'
	},
	{
		tier: 'PRO',
		priceMxnMonthly: null,
		priceUsdMonthly: null,
		priceNote: 'contact'
	}
];
