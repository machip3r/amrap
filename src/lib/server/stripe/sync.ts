import { getStripe } from '$lib/stripe/server';
import type Stripe from 'stripe';
import { createServiceRoleClient } from '$lib/supabase/admin';
import {
	intervalFromLookupKey,
	normalizeBillingInterval,
	tierFromLookupKey,
	tierFromStripeMetadata,
	toStoredSubscriptionStatus,
	type BillingInterval
} from '$lib/stripe/catalog';
import type { OrgPlanTier } from '$lib/types';

type OrgBillingPatch = {
	plan_tier?: OrgPlanTier;
	stripe_customer_id?: string | null;
	stripe_subscription_id?: string | null;
	stripe_subscription_status?: string | null;
	billing_interval?: BillingInterval | null;
	stripe_cancel_at_period_end?: boolean;
	stripe_cancel_at?: string | null;
};

function unixToIso(unix: number | null | undefined): string | null {
	if (unix == null || !Number.isFinite(unix)) return null;
	return new Date(unix * 1000).toISOString();
}

/** Scheduled cancel fields while the sub is still entitled; cleared when ended. */
function cancelSchedulePatch(
	sub: Stripe.Subscription,
	isEntitled: boolean
): Pick<OrgBillingPatch, 'stripe_cancel_at_period_end' | 'stripe_cancel_at'> {
	if (!isEntitled) {
		return { stripe_cancel_at_period_end: false, stripe_cancel_at: null };
	}
	return {
		stripe_cancel_at_period_end: Boolean(sub.cancel_at_period_end),
		stripe_cancel_at: unixToIso(sub.cancel_at)
	};
}

function paidTierFromSubscription(sub: Stripe.Subscription): {
	tier: OrgPlanTier | null;
	interval: BillingInterval | null;
	lookupKey: string | null;
} {
	const item = sub.items.data[0];
	const lookupKey = item?.price?.lookup_key ?? null;
	const fromLookup = tierFromLookupKey(lookupKey);
	const fromMeta =
		tierFromStripeMetadata(sub.metadata) ??
		tierFromStripeMetadata(item?.price?.metadata as Record<string, string> | undefined);
	return {
		tier: fromLookup ?? fromMeta,
		interval: intervalFromLookupKey(lookupKey),
		lookupKey
	};
}

async function updateOrgById(orgId: string, patch: OrgBillingPatch) {
	const admin = createServiceRoleClient();
	if (!admin) {
		console.error('stripe sync: missing service role');
		return;
	}
	const { error } = await admin.from('organizations').update(patch).eq('id', orgId);
	if (error) {
		console.error('stripe sync updateOrgById', orgId, error.message);
	}
}

async function findOrgId(opts: {
	organizationId?: string | null;
	customerId?: string | null;
	subscriptionId?: string | null;
}): Promise<string | null> {
	const admin = createServiceRoleClient();
	if (!admin) return null;

	if (opts.organizationId) {
		const { data } = await admin
			.from('organizations')
			.select('id')
			.eq('id', opts.organizationId)
			.maybeSingle();
		if (data?.id) return data.id;
	}

	if (opts.customerId) {
		const { data } = await admin
			.from('organizations')
			.select('id')
			.eq('stripe_customer_id', opts.customerId)
			.maybeSingle();
		if (data?.id) return data.id;
	}

	if (opts.subscriptionId) {
		const { data } = await admin
			.from('organizations')
			.select('id')
			.eq('stripe_subscription_id', opts.subscriptionId)
			.maybeSingle();
		if (data?.id) return data.id;
	}

	return null;
}

export async function syncOrganizationFromSubscription(sub: Stripe.Subscription) {
	const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
	const orgId = await findOrgId({
		organizationId: sub.metadata?.organization_id ?? null,
		customerId,
		subscriptionId: sub.id
	});
	if (!orgId) {
		console.error('stripe sync: org not found for subscription', sub.id);
		return;
	}

	const { tier, interval } = paidTierFromSubscription(sub);
	const status = sub.status;
	const isEntitled =
		status === 'active' || status === 'trialing' || status === 'past_due';

	const patch: OrgBillingPatch = {
		stripe_customer_id: customerId ?? undefined,
		stripe_subscription_id: isEntitled ? sub.id : null,
		stripe_subscription_status: toStoredSubscriptionStatus(status),
		billing_interval: isEntitled ? interval : null,
		...cancelSchedulePatch(sub, isEntitled)
	};

	if (isEntitled && tier && (tier === 'STARTER' || tier === 'GROWTH' || tier === 'PRO')) {
		patch.plan_tier = tier;
	} else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
		patch.plan_tier = 'FREEMIUM';
		patch.stripe_subscription_id = null;
		patch.billing_interval = null;
		patch.stripe_cancel_at_period_end = false;
		patch.stripe_cancel_at = null;
	}

	await updateOrgById(orgId, patch);
}

export async function syncOrganizationFromCheckoutSession(session: Stripe.Checkout.Session) {
	if (session.mode !== 'subscription') return;

	const orgId =
		session.metadata?.organization_id ??
		(typeof session.client_reference_id === 'string' ? session.client_reference_id : null);
	const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
	const subscriptionId =
		typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

	const resolvedOrgId = await findOrgId({
		organizationId: orgId,
		customerId,
		subscriptionId
	});
	if (!resolvedOrgId) {
		console.error('stripe sync: org not found for checkout session', session.id);
		return;
	}

	const tierMeta = tierFromStripeMetadata(session.metadata);
	const patch: OrgBillingPatch = {
		stripe_customer_id: customerId ?? undefined,
		stripe_subscription_id: subscriptionId ?? undefined,
		stripe_subscription_status: 'ACTIVE',
		stripe_cancel_at_period_end: false,
		stripe_cancel_at: null
	};
	if (tierMeta === 'STARTER' || tierMeta === 'GROWTH') {
		patch.plan_tier = tierMeta;
	}
	const interval = normalizeBillingInterval(session.metadata?.billing_interval);
	if (interval) {
		patch.billing_interval = interval;
	}

	await updateOrgById(resolvedOrgId, patch);
}

/** Sync org tier after Embedded Checkout return (`session_id` query). */
export async function syncOrgFromCheckoutSessionId(sessionId: string): Promise<boolean> {
	try {
		const stripe = getStripe();
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['subscription']
		});
		await syncOrganizationFromCheckoutSession(session);
		if (session.subscription && typeof session.subscription !== 'string') {
			await syncOrganizationFromSubscription(session.subscription);
		} else if (typeof session.subscription === 'string') {
			const sub = await stripe.subscriptions.retrieve(session.subscription);
			await syncOrganizationFromSubscription(sub);
		}
		return true;
	} catch (err) {
		console.error('syncOrgFromCheckoutSessionId', err);
		return false;
	}
}
