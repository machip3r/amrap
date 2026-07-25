import Stripe from 'stripe';
import { getServiceRoleClient } from './supabase';

export type SelfServeTier = 'STARTER' | 'GROWTH';
export type BillingInterval = 'MONTH' | 'YEAR';

const PRICE_LOOKUP_KEYS: Record<SelfServeTier, Record<BillingInterval, string>> = {
	STARTER: {
		MONTH: 'starter_mxn_monthly',
		YEAR: 'starter_mxn_annual'
	},
	GROWTH: {
		MONTH: 'growth_mxn_monthly',
		YEAR: 'growth_mxn_annual'
	}
};

export type OrgBillingSnapshot = {
	plan_tier: string;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	stripe_subscription_status: string | null;
	billing_interval: string | null;
};

export type SeededStripeOrg = {
	customerId: string;
	subscriptionId: string;
	priceId: string;
	tier: SelfServeTier;
	interval: BillingInterval;
};

let stripeClient: Stripe | null = null;

export function hasStripeTestEnv(): boolean {
	const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
	const publishable =
		process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ??
		process.env.STRIPE_PUBLISHABLE_KEY?.trim() ??
		'';
	return secret.startsWith('sk_test_') && publishable.startsWith('pk_test_');
}

export function hasStripeWebhookSecret(): boolean {
	const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
	return secret.startsWith('whsec_');
}

export function getStripe(): Stripe {
	if (stripeClient) return stripeClient;
	const key = process.env.STRIPE_SECRET_KEY?.trim();
	if (!key?.startsWith('sk_test_')) {
		throw new Error('E2E Stripe helpers require STRIPE_SECRET_KEY=sk_test_…');
	}
	stripeClient = new Stripe(key);
	return stripeClient;
}

export function priceLookupKey(tier: SelfServeTier, interval: BillingInterval): string {
	return PRICE_LOOKUP_KEYS[tier][interval];
}

export async function resolvePriceId(
	tier: SelfServeTier,
	interval: BillingInterval
): Promise<string> {
	const stripe = getStripe();
	const lookup = priceLookupKey(tier, interval);
	const prices = await stripe.prices.list({
		lookup_keys: [lookup],
		active: true,
		limit: 1
	});
	const price = prices.data[0];
	if (!price) {
		throw new Error(`Missing Stripe test price for lookup_key=${lookup}`);
	}
	return price.id;
}

export async function getOrganizationIdForUser(userId: string): Promise<string> {
	const admin = getServiceRoleClient();
	const { data, error } = await admin
		.from('organizations')
		.select('id')
		.eq('created_by', userId)
		.is('deleted_at', null)
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();
	if (error || !data?.id) {
		throw new Error(`No organization for user ${userId}: ${error?.message ?? 'not found'}`);
	}
	return data.id as string;
}

export async function readOrgBilling(organizationId: string): Promise<OrgBillingSnapshot> {
	const admin = getServiceRoleClient();
	const { data, error } = await admin
		.from('organizations')
		.select(
			'plan_tier, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, billing_interval'
		)
		.eq('id', organizationId)
		.single();
	if (error || !data) {
		throw new Error(`readOrgBilling failed: ${error?.message ?? 'no row'}`);
	}
	return data as OrgBillingSnapshot;
}

export async function writeOrgBilling(
	organizationId: string,
	patch: Partial<OrgBillingSnapshot>
): Promise<void> {
	const admin = getServiceRoleClient();
	const { error } = await admin.from('organizations').update(patch).eq('id', organizationId);
	if (error) {
		throw new Error(`writeOrgBilling failed: ${error.message}`);
	}
}

export async function resetOrgBillingToFreemium(organizationId: string): Promise<void> {
	await writeOrgBilling(organizationId, {
		plan_tier: 'FREEMIUM',
		stripe_customer_id: null,
		stripe_subscription_id: null,
		stripe_subscription_status: null,
		billing_interval: null
	});
}

/**
 * Create an active test subscription and mirror billing columns on the org.
 */
export async function seedPaidOrg(opts: {
	organizationId: string;
	email: string;
	orgName?: string;
	tier: SelfServeTier;
	interval: BillingInterval;
}): Promise<SeededStripeOrg> {
	const stripe = getStripe();
	const priceId = await resolvePriceId(opts.tier, opts.interval);

	const customer = await stripe.customers.create({
		email: opts.email,
		name: opts.orgName ?? `E2E Billing ${opts.organizationId.slice(0, 8)}`,
		metadata: {
			organization_id: opts.organizationId,
			amrap_source: 'e2e_billing'
		}
	});

	const paymentMethod = await stripe.paymentMethods.create({
		type: 'card',
		card: { token: 'tok_visa' }
	});
	await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
	await stripe.customers.update(customer.id, {
		invoice_settings: { default_payment_method: paymentMethod.id }
	});

	const subscription = await stripe.subscriptions.create({
		customer: customer.id,
		items: [{ price: priceId }],
		default_payment_method: paymentMethod.id,
		metadata: {
			organization_id: opts.organizationId,
			amrap_tier: opts.tier,
			billing_interval: opts.interval
		}
	});

	await writeOrgBilling(opts.organizationId, {
		plan_tier: opts.tier,
		stripe_customer_id: customer.id,
		stripe_subscription_id: subscription.id,
		stripe_subscription_status: subscription.status.toUpperCase(),
		billing_interval: opts.interval
	});

	return {
		customerId: customer.id,
		subscriptionId: subscription.id,
		priceId,
		tier: opts.tier,
		interval: opts.interval
	};
}

export async function changeSubscriptionPrice(
	subscriptionId: string,
	tier: SelfServeTier,
	interval: BillingInterval
): Promise<Stripe.Subscription> {
	const stripe = getStripe();
	const priceId = await resolvePriceId(tier, interval);
	const sub = await stripe.subscriptions.retrieve(subscriptionId);
	const itemId = sub.items.data[0]?.id;
	if (!itemId) throw new Error(`Subscription ${subscriptionId} has no items`);

	return stripe.subscriptions.update(subscriptionId, {
		items: [{ id: itemId, price: priceId }],
		proration_behavior: 'always_invoice',
		metadata: {
			...sub.metadata,
			amrap_tier: tier,
			billing_interval: interval
		}
	});
}

export async function cancelSubscription(
	subscriptionId: string
): Promise<Stripe.Subscription> {
	const stripe = getStripe();
	return stripe.subscriptions.cancel(subscriptionId);
}

/** Best-effort Stripe cleanup (ignore already-deleted resources). */
export async function cleanupStripeCustomer(customerId: string | null | undefined): Promise<void> {
	if (!customerId) return;
	const stripe = getStripe();
	try {
		const subs = await stripe.subscriptions.list({
			customer: customerId,
			status: 'all',
			limit: 20
		});
		for (const sub of subs.data) {
			if (sub.status !== 'canceled') {
				try {
					await stripe.subscriptions.cancel(sub.id);
				} catch {
					/* ignore */
				}
			}
		}
		await stripe.customers.del(customerId);
	} catch {
		/* ignore */
	}
}

/**
 * POST a signed Stripe webhook event to the local app.
 * Requires STRIPE_WEBHOOK_SECRET (from `stripe listen` or Dashboard test endpoint).
 */
export async function postWebhookEvent(
	baseURL: string,
	event: {
		type: string;
		data: { object: unknown };
		id?: string;
		api_version?: string;
		created?: number;
	}
): Promise<Response> {
	const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
	if (!secret?.startsWith('whsec_')) {
		throw new Error('postWebhookEvent requires STRIPE_WEBHOOK_SECRET=whsec_…');
	}

	const stripe = getStripe();
	const fullEvent = {
		id: event.id ?? `evt_e2e_${Date.now()}`,
		object: 'event',
		api_version: event.api_version ?? '2025-01-27.acacia',
		created: event.created ?? Math.floor(Date.now() / 1000),
		livemode: false,
		pending_webhooks: 1,
		request: null,
		type: event.type,
		data: event.data
	};
	const payload = JSON.stringify(fullEvent);
	const header = stripe.webhooks.generateTestHeaderString({
		payload,
		secret
	});

	return fetch(new URL('/api/stripe/webhook', baseURL).toString(), {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'stripe-signature': header
		},
		body: payload
	});
}

export async function postSubscriptionDeletedWebhook(
	baseURL: string,
	subscription: Stripe.Subscription
): Promise<void> {
	const res = await postWebhookEvent(baseURL, {
		type: 'customer.subscription.deleted',
		data: { object: subscription }
	});
	if (!res.ok) {
		throw new Error(`subscription.deleted webhook failed: ${res.status} ${await res.text()}`);
	}
}

export async function postCheckoutSessionCompletedWebhook(
	baseURL: string,
	session: Stripe.Checkout.Session
): Promise<void> {
	const res = await postWebhookEvent(baseURL, {
		type: 'checkout.session.completed',
		data: { object: session }
	});
	if (!res.ok) {
		throw new Error(`checkout.session.completed webhook failed: ${res.status} ${await res.text()}`);
	}
}

/** After Embedded Checkout, sync org from Stripe if webhooks did not run. */
export async function syncOrgFromLatestCheckout(opts: {
	baseURL: string;
	organizationId: string;
	customerId: string;
}): Promise<void> {
	const stripe = getStripe();
	const sessions = await stripe.checkout.sessions.list({
		customer: opts.customerId,
		limit: 5
	});
	const session = sessions.data.find(
		(s) =>
			s.mode === 'subscription' &&
			s.status === 'complete' &&
			(s.metadata?.organization_id === opts.organizationId ||
				s.client_reference_id === opts.organizationId)
	);
	if (!session) {
		throw new Error('No completed Checkout session found to sync');
	}

	const full = await stripe.checkout.sessions.retrieve(session.id, {
		expand: ['subscription']
	});

	if (hasStripeWebhookSecret()) {
		await postCheckoutSessionCompletedWebhook(opts.baseURL, full);
		if (typeof full.subscription === 'string') {
			const sub = await stripe.subscriptions.retrieve(full.subscription);
			await postWebhookEvent(opts.baseURL, {
				type: 'customer.subscription.updated',
				data: { object: sub }
			});
		} else if (full.subscription && typeof full.subscription === 'object') {
			await postWebhookEvent(opts.baseURL, {
				type: 'customer.subscription.updated',
				data: { object: full.subscription }
			});
		}
		return;
	}

	// Fallback without webhook secret: mirror sync.ts via Admin.
	const subId =
		typeof full.subscription === 'string'
			? full.subscription
			: full.subscription && typeof full.subscription === 'object'
				? full.subscription.id
				: null;
	const tier = (full.metadata?.amrap_tier ?? '').toUpperCase();
	const interval = (full.metadata?.billing_interval ?? '').toUpperCase();
	await writeOrgBilling(opts.organizationId, {
		plan_tier: tier === 'GROWTH' ? 'GROWTH' : 'STARTER',
		stripe_customer_id: opts.customerId,
		stripe_subscription_id: subId,
		stripe_subscription_status: 'ACTIVE',
		billing_interval: interval === 'YEAR' ? 'YEAR' : 'MONTH'
	});
}

export async function waitForOrgPlan(
	organizationId: string,
	expectedTier: string,
	timeoutMs = 30_000
): Promise<OrgBillingSnapshot> {
	const deadline = Date.now() + timeoutMs;
	let last: OrgBillingSnapshot | null = null;
	while (Date.now() < deadline) {
		last = await readOrgBilling(organizationId);
		if (last.plan_tier === expectedTier) return last;
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(
		`Timed out waiting for plan_tier=${expectedTier} (got ${last?.plan_tier ?? 'null'})`
	);
}
