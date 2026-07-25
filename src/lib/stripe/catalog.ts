import type { OrgPlanTier } from '$lib/types';

/** Self-serve paid tiers only (Pro is contact sales). */
export type SelfServeTier = 'STARTER' | 'GROWTH';

/** Stored on `organizations.billing_interval`. */
export type BillingInterval = 'MONTH' | 'YEAR';

/** Stripe Price lookup_keys — MXN only for v1. */
export const PRICE_LOOKUP_KEYS = {
	STARTER: {
		MONTH: 'starter_mxn_monthly',
		YEAR: 'starter_mxn_annual'
	},
	GROWTH: {
		MONTH: 'growth_mxn_monthly',
		YEAR: 'growth_mxn_annual'
	}
} as const satisfies Record<SelfServeTier, Record<BillingInterval, string>>;

const LOOKUP_TO_TIER: Record<string, SelfServeTier> = {
	starter_mxn_monthly: 'STARTER',
	starter_mxn_annual: 'STARTER',
	growth_mxn_monthly: 'GROWTH',
	growth_mxn_annual: 'GROWTH'
};

const LOOKUP_TO_INTERVAL: Record<string, BillingInterval> = {
	starter_mxn_monthly: 'MONTH',
	starter_mxn_annual: 'YEAR',
	growth_mxn_monthly: 'MONTH',
	growth_mxn_annual: 'YEAR'
};

export function isSelfServeTier(tier: string): tier is SelfServeTier {
	return tier === 'STARTER' || tier === 'GROWTH';
}

export function priceLookupKey(tier: SelfServeTier, interval: BillingInterval): string {
	return PRICE_LOOKUP_KEYS[tier][interval];
}

export function tierFromLookupKey(lookupKey: string | null | undefined): SelfServeTier | null {
	if (!lookupKey) return null;
	return LOOKUP_TO_TIER[lookupKey] ?? null;
}

export function intervalFromLookupKey(
	lookupKey: string | null | undefined
): BillingInterval | null {
	if (!lookupKey) return null;
	return LOOKUP_TO_INTERVAL[lookupKey] ?? null;
}

/** Accepts form/UI (`month`/`year`) or stored (`MONTH`/`YEAR`) values. */
export function normalizeBillingInterval(
	raw: string | null | undefined
): BillingInterval | null {
	const u = raw?.trim().toUpperCase();
	if (u === 'MONTH' || u === 'YEAR') return u;
	return null;
}

/** Stripe API statuses are lowercase; we persist uppercase on `organizations`. */
export function toStoredSubscriptionStatus(status: string): string {
	return status.trim().toUpperCase();
}

export function tierFromStripeMetadata(
	metadata: Record<string, string> | null | undefined
): OrgPlanTier | null {
	const raw = metadata?.amrap_tier?.toUpperCase();
	if (raw === 'STARTER' || raw === 'GROWTH' || raw === 'PRO' || raw === 'FREEMIUM') {
		return raw;
	}
	return null;
}

export function randomIntegrationSuffix(length = 8): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz';
	let out = '';
	for (let i = 0; i < length; i++) {
		out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
	}
	return out;
}
