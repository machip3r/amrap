import { getSessionUser, getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	isSelfServeTier,
	normalizeBillingInterval,
	priceLookupKey,
	toStoredSubscriptionStatus,
	type BillingInterval,
	type SelfServeTier
} from '$lib/stripe/catalog';
import { PLAN_TIER_RANK } from '$lib/plans/limits';
import { getStripe } from '$lib/stripe/server';
import { getPublicAppUrl } from '$lib/supabase/env';
import { createClient } from '$lib/supabase/server';
import { formString, localeSchema } from '$lib/validation/schemas';
import type { OrgPlanTier } from '$lib/types';

export type OrgActionState = {
	error?: string;
	success?: boolean;
	message?: string;
	/** Stripe Embedded Checkout client secret — mount in-app (PWA-friendly). */
	clientSecret?: string;
	/** Customer Portal URL — open in a new tab so the PWA shell stays. */
	portalUrl?: string;
} | null;

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

function intervalFromForm(formData: FormData): BillingInterval {
	return normalizeBillingInterval(formString(formData, 'interval')) ?? 'MONTH';
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
	const supabase = createClient();

	try {
		const liveSubId = org.stripe_subscription_id;
		if (liveSubId) {
			const sub = await stripe.subscriptions.retrieve(liveSubId);
			const liveOk = ['active', 'trialing', 'past_due'].includes(sub.status);

			if (!liveOk) {
				// Canceled (or expired) subs cannot change prices — clear stale ids and use Checkout.
				await supabase
					.from('organizations')
					.update({
						stripe_subscription_id: null,
						stripe_subscription_status: toStoredSubscriptionStatus(sub.status),
						plan_tier: 'FREEMIUM',
						billing_interval: null
					})
					.eq('id', org.id);
			} else {
				const itemId = sub.items.data[0]?.id;
				if (!itemId) {
					return { error: d.organization.checkoutFailed };
				}

				// create_prorations only queues the delta for the *next* invoice.
				// always_invoice charges (or credits) immediately — required for upgrades.
				const isUpgrade = PLAN_TIER_RANK[tier] > PLAN_TIER_RANK[org.plan_tier];
				await stripe.subscriptions.update(liveSubId, {
					items: [{ id: itemId, price: priceId }],
					proration_behavior: 'always_invoice',
					...(isUpgrade ? { payment_behavior: 'error_if_incomplete' as const } : {}),
					metadata: {
						organization_id: org.id,
						amrap_tier: tier,
						billing_interval: interval
					}
				});

				await supabase
					.from('organizations')
					.update({
						plan_tier: tier,
						billing_interval: interval,
						stripe_subscription_status: 'ACTIVE'
					})
					.eq('id', org.id);

				return { success: true, message: d.organization.upgradeSuccess };
			}
		}

		const customerId = await ensureStripeCustomer(org, user?.email ?? undefined);
		const returnRaw = (formString(formData, 'return_to') || 'organization').toLowerCase();
		const returnPath = returnRaw === 'onboarding' ? 'onboarding' : 'organization';
		const returnUrl = `${appOrigin()}/${locale}/${returnPath}?billing=success&session_id={CHECKOUT_SESSION_ID}`;

		const session = await stripe.checkout.sessions.create({
			// Stripe renamed `embedded` → `embedded_page` (API still mounts via initEmbeddedCheckout).
			ui_mode: 'embedded_page',
			mode: 'subscription',
			customer: customerId,
			client_reference_id: org.id,
			line_items: [{ price: priceId, quantity: 1 }],
			return_url: returnUrl,
			redirect_on_completion: 'always',
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

		if (!session.client_secret) {
			return { error: d.organization.checkoutFailed };
		}

		return { success: true, clientSecret: session.client_secret };
	} catch (err) {
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
		return { success: true, portalUrl: portal.url };
	} catch (err) {
		console.error('requestBillingPortal', err);
		return { error: d.organization.checkoutFailed };
	}
}
