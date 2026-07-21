import { isRedirect, redirect } from '@sveltejs/kit';
import { getSessionUser, getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	isSelfServeTier,
	priceLookupKey,
	type BillingInterval,
	type SelfServeTier
} from '$lib/stripe/catalog';
import { getStripe } from '$lib/stripe/server';
import { getPublicAppUrl } from '$lib/supabase/env';
import { createClient } from '$lib/supabase/server';
import { formString, localeSchema } from '$lib/validation/schemas';
import type { OrgPlanTier } from '$lib/types';

export type OrgActionState = {
	error?: string;
	success?: boolean;
	message?: string;
} | null;

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

function intervalFromForm(formData: FormData): BillingInterval {
	const raw = formString(formData, 'interval');
	return raw === 'year' ? 'year' : 'month';
}

async function requireBillingWorkspace() {
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return null;
	}
	return workspace;
}

type OrgBillingRow = {
	id: string;
	name: string;
	plan_tier: OrgPlanTier;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	stripe_subscription_status: string | null;
	billing_interval: string | null;
};

async function loadOrgBilling(organizationId: string): Promise<OrgBillingRow | null> {
	const supabase = createClient();
	const { data, error } = await supabase
		.from('organizations')
		.select(
			'id, name, plan_tier, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, billing_interval'
		)
		.eq('id', organizationId)
		.maybeSingle();
	if (error || !data) {
		console.error('loadOrgBilling', error?.message);
		return null;
	}
	return data as OrgBillingRow;
}

async function resolvePriceId(tier: SelfServeTier, interval: BillingInterval): Promise<string> {
	const stripe = getStripe();
	const lookup = priceLookupKey(tier, interval);
	const prices = await stripe.prices.list({
		lookup_keys: [lookup],
		active: true,
		limit: 1
	});
	const price = prices.data[0];
	if (!price) {
		throw new Error(`Missing Stripe price for lookup_key=${lookup}`);
	}
	return price.id;
}

async function ensureStripeCustomer(org: OrgBillingRow, email: string | undefined): Promise<string> {
	const stripe = getStripe();
	if (org.stripe_customer_id) {
		return org.stripe_customer_id;
	}

	const customer = await stripe.customers.create({
		email: email || undefined,
		name: org.name,
		metadata: {
			organization_id: org.id,
			amrap_source: 'organization_billing'
		}
	});

	const supabase = createClient();
	const { error } = await supabase
		.from('organizations')
		.update({ stripe_customer_id: customer.id })
		.eq('id', org.id);
	if (error) {
		console.error('ensureStripeCustomer persist', error.message);
	}

	return customer.id;
}

function appOrigin(): string {
	return getPublicAppUrl() || 'http://localhost:5173';
}

/**
 * Freemium → paid: Checkout Session.
 * Existing paid sub → Subscriptions API update with proration (in-app confirm).
 */
export async function requestSubscriptionCheckout(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const tierRaw = formString(formData, 'tier');
	if (tierRaw === 'PRO') {
		return { success: true, message: d.organization.contactProPlan };
	}
	if (!isSelfServeTier(tierRaw)) {
		return { error: d.organization.invalidPlan };
	}
	const tier = tierRaw;
	const interval = intervalFromForm(formData);

	if (workspace.planTier === tier) {
		return { success: true, message: d.organization.alreadyOnPlan };
	}

	const org = await loadOrgBilling(workspace.organizationId);
	if (!org) return { error: d.organization.checkoutFailed };

	const user = await getSessionUser();
	let priceId: string;
	try {
		priceId = await resolvePriceId(tier, interval);
	} catch (err) {
		console.error('resolvePriceId', err);
		return { error: d.organization.checkoutFailed };
	}

	const stripe = getStripe();

	try {
		const hasActiveSub =
			Boolean(org.stripe_subscription_id) &&
			org.plan_tier !== 'FREEMIUM' &&
			['active', 'trialing', 'past_due'].includes(org.stripe_subscription_status ?? '');

		if (hasActiveSub && org.stripe_subscription_id) {
			const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
			const itemId = sub.items.data[0]?.id;
			if (!itemId) {
				return { error: d.organization.checkoutFailed };
			}

			await stripe.subscriptions.update(org.stripe_subscription_id, {
				items: [{ id: itemId, price: priceId }],
				proration_behavior: 'create_prorations',
				metadata: {
					organization_id: org.id,
					amrap_tier: tier,
					billing_interval: interval
				}
			});

			const supabase = createClient();
			await supabase
				.from('organizations')
				.update({
					plan_tier: tier,
					billing_interval: interval,
					stripe_subscription_status: 'active'
				})
				.eq('id', org.id);

			return { success: true, message: d.organization.upgradeSuccess };
		}

		const customerId = await ensureStripeCustomer(org, user?.email ?? undefined);
		const successUrl = `${appOrigin()}/${locale}/organization?billing=success`;
		const cancelUrl = `${appOrigin()}/${locale}/organization?billing=cancel`;

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			client_reference_id: org.id,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			subscription_data: {
				metadata: {
					organization_id: org.id,
					amrap_tier: tier,
					billing_interval: interval
				}
			},
			metadata: {
				organization_id: org.id,
				amrap_tier: tier,
				billing_interval: interval
			}
		});

		if (!session.url) {
			return { error: d.organization.checkoutFailed };
		}

		throw redirect(303, session.url);
	} catch (err) {
		if (isRedirect(err)) throw err;
		console.error('requestSubscriptionCheckout', err);
		return { error: d.organization.checkoutFailed };
	}
}

/** Opens Stripe Customer Portal for payment method / invoices / cancel. */
export async function requestBillingPortal(formData: FormData): Promise<OrgActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await requireBillingWorkspace();
	if (!workspace) return { error: d.common.forbidden };

	const org = await loadOrgBilling(workspace.organizationId);
	if (!org?.stripe_customer_id) {
		return { error: d.organization.portalUnavailable };
	}

	try {
		const stripe = getStripe();
		const portal = await stripe.billingPortal.sessions.create({
			customer: org.stripe_customer_id,
			return_url: `${appOrigin()}/${locale}/organization`
		});
		if (!portal.url) {
			return { error: d.organization.checkoutFailed };
		}
		throw redirect(303, portal.url);
	} catch (err) {
		if (isRedirect(err)) throw err;
		console.error('requestBillingPortal', err);
		return { error: d.organization.checkoutFailed };
	}
}
