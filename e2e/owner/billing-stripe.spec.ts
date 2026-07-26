import { test, expect } from '@playwright/test';
import { readCreds, ownerCredsPath } from '../fixtures/owner';
import {
	chooseBillingInterval,
	clickManageBilling,
	expectCurrentPlan,
	expectFlash,
	fillEmbeddedCheckoutTestCard,
	gotoOrganization,
	openPlanConfirm,
	submitPlanConfirm,
	waitForEmbeddedCheckout
} from '../helpers/billing-ui';
import {
	cancelSubscription,
	cleanupStripeCustomer,
	getOrganizationIdForUser,
	hasStripeTestEnv,
	hasStripeWebhookSecret,
	postSubscriptionDeletedWebhook,
	readOrgBilling,
	resetOrgBillingToFreemium,
	seedPaidOrg,
	syncOrgFromLatestCheckout,
	waitForOrgPlan,
	writeOrgBilling,
	type OrgBillingSnapshot
} from '../helpers/stripe';

test.describe('owner Stripe billing (hybrid)', () => {
	test.skip(!hasStripeTestEnv(), 'Requires STRIPE_SECRET_KEY=sk_test_… and PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…');

	let organizationId: string;
	let ownerEmail: string;
	let snapshot: OrgBillingSnapshot;
	let stripeCustomerToCleanup: string | null = null;

	test.beforeAll(async () => {
		const creds = readCreds(ownerCredsPath());
		ownerEmail = creds.email;
		organizationId = await getOrganizationIdForUser(creds.userId);
	});

	test.beforeEach(async () => {
		snapshot = await readOrgBilling(organizationId);
		stripeCustomerToCleanup = null;
	});

	test.afterEach(async () => {
		if (process.env.E2E_SKIP_CLEANUP === '1') return;

		try {
			const current = await readOrgBilling(organizationId).catch(() => null);
			const customerId =
				stripeCustomerToCleanup ??
				current?.stripe_customer_id ??
				snapshot.stripe_customer_id;

			await cleanupStripeCustomer(customerId);

			// Restore pre-test billing columns so other owner specs stay Freemium-clean.
			await writeOrgBilling(organizationId, {
				plan_tier: snapshot.plan_tier || 'FREEMIUM',
				stripe_customer_id: snapshot.stripe_customer_id,
				stripe_subscription_id: snapshot.stripe_subscription_id,
				stripe_subscription_status: snapshot.stripe_subscription_status,
				billing_interval: snapshot.billing_interval
			});
		} catch (err) {
			console.warn('billing-stripe afterEach cleanup', err);
		}
	});

	test('Freemium → Starter monthly via Embedded Checkout', async ({ page, baseURL }) => {
		test.setTimeout(180_000);
		await resetOrgBillingToFreemium(organizationId);
		await gotoOrganization(page);
		await expectCurrentPlan(page, 'FREEMIUM');

		await openPlanConfirm(page, 'STARTER');
		await chooseBillingInterval(page, 'month');
		await submitPlanConfirm(page);

		await fillEmbeddedCheckoutTestCard(page);

		// Wait for success flash or return URL; then ensure DB is synced.
		// Do not match bare "Starter" — that appears in the plan list before payment.
		await Promise.race([
			page.waitForURL(/billing=success/, { timeout: 90_000 }),
			expectFlash(page, /Pago recibido|Payment received/i)
		]).catch(() => undefined);

		const billing = await readOrgBilling(organizationId);
		if (billing.stripe_customer_id) {
			stripeCustomerToCleanup = billing.stripe_customer_id;
		}

		if (billing.plan_tier !== 'STARTER' && billing.stripe_customer_id && baseURL) {
			await syncOrgFromLatestCheckout({
				baseURL,
				organizationId,
				customerId: billing.stripe_customer_id
			});
		} else if (billing.plan_tier !== 'STARTER') {
			// Customer may exist on Stripe from Checkout even if not yet persisted.
			const { getStripe } = await import('../helpers/stripe');
			const stripe = getStripe();
			const customers = await stripe.customers.list({ email: ownerEmail, limit: 5 });
			const customer = customers.data.find(
				(c) => c.metadata?.organization_id === organizationId
			);
			if (!customer || !baseURL) {
				throw new Error(
					'Checkout did not sync plan. Run `stripe listen --forward-to localhost:5173/api/stripe/webhook` and set STRIPE_WEBHOOK_SECRET.'
				);
			}
			stripeCustomerToCleanup = customer.id;
			await syncOrgFromLatestCheckout({
				baseURL,
				organizationId,
				customerId: customer.id
			});
		}

		await waitForOrgPlan(organizationId, 'STARTER');
		await gotoOrganization(page);
		await expectCurrentPlan(page, 'STARTER');
	});

	test('Freemium → Growth annual via Embedded Checkout', async ({ page, baseURL }) => {
		test.setTimeout(180_000);
		await resetOrgBillingToFreemium(organizationId);
		await gotoOrganization(page);

		await openPlanConfirm(page, 'GROWTH');
		await chooseBillingInterval(page, 'year');
		await submitPlanConfirm(page);
		await fillEmbeddedCheckoutTestCard(page);

		await Promise.race([
			page.waitForURL(/billing=success/, { timeout: 90_000 }),
			expectFlash(page, /Pago recibido|Payment received/i)
		]).catch(() => undefined);

		let billing = await readOrgBilling(organizationId);
		if (billing.stripe_customer_id) stripeCustomerToCleanup = billing.stripe_customer_id;

		if (billing.plan_tier !== 'GROWTH' && baseURL) {
			const { getStripe } = await import('../helpers/stripe');
			const stripe = getStripe();
			const customers = await stripe.customers.list({ email: ownerEmail, limit: 5 });
			const customer =
				customers.data.find((c) => c.metadata?.organization_id === organizationId) ??
				(billing.stripe_customer_id
					? { id: billing.stripe_customer_id }
					: null);
			if (!customer) {
				throw new Error(
					'Checkout did not sync Growth. Ensure stripe listen + STRIPE_WEBHOOK_SECRET.'
				);
			}
			stripeCustomerToCleanup = customer.id;
			await syncOrgFromLatestCheckout({
				baseURL,
				organizationId,
				customerId: customer.id
			});
		}

		await waitForOrgPlan(organizationId, 'GROWTH');
		billing = await readOrgBilling(organizationId);
		expect(billing.billing_interval).toBe('YEAR');
		await gotoOrganization(page);
		await expectCurrentPlan(page, 'GROWTH');
	});

	test('Starter → Growth upgrade via Subscriptions API (no Checkout iframe)', async ({
		page
	}) => {
		const seeded = await seedPaidOrg({
			organizationId,
			email: ownerEmail,
			tier: 'STARTER',
			interval: 'MONTH'
		});
		stripeCustomerToCleanup = seeded.customerId;

		await gotoOrganization(page);
		await expectCurrentPlan(page, 'STARTER');

		await openPlanConfirm(page, 'GROWTH');
		await chooseBillingInterval(page, 'month');
		await submitPlanConfirm(page);

		await expectFlash(page, /Suscripción actualizada|Subscription updated/i);
		await waitForOrgPlan(organizationId, 'GROWTH');
		await gotoOrganization(page);
		await expectCurrentPlan(page, 'GROWTH');
		await expect(page.locator('#subscription iframe')).toHaveCount(0);
	});

	test('Growth → Starter downgrade via UI', async ({ page }) => {
		const seeded = await seedPaidOrg({
			organizationId,
			email: ownerEmail,
			tier: 'GROWTH',
			interval: 'MONTH'
		});
		stripeCustomerToCleanup = seeded.customerId;

		await gotoOrganization(page);
		await openPlanConfirm(page, 'STARTER');
		await chooseBillingInterval(page, 'month');
		await submitPlanConfirm(page);

		await expectFlash(page, /Suscripción actualizada|Subscription updated/i);
		await waitForOrgPlan(organizationId, 'STARTER');
		await gotoOrganization(page);
		await expectCurrentPlan(page, 'STARTER');
	});

	test('same-tier checkout returns alreadyOnPlan', async ({ page }) => {
		const seeded = await seedPaidOrg({
			organizationId,
			email: ownerEmail,
			tier: 'STARTER',
			interval: 'MONTH'
		});
		stripeCustomerToCleanup = seeded.customerId;

		await gotoOrganization(page);

		const response = await page.request.post('/es/organization?/checkout', {
			form: {
				locale: 'es',
				tier: 'STARTER',
				interval: 'month'
			},
			headers: {
				Accept: 'application/json',
				'x-sveltekit-action': 'true'
			}
		});
		expect(response.ok()).toBeTruthy();
		const json = (await response.json()) as {
			type?: string;
			data?: { message?: string };
			message?: string;
		};
		const message = json.data?.message ?? json.message ?? JSON.stringify(json);
		expect(message).toMatch(/Ya estás en este plan|already on this plan/i);

		// Current plan row is not actionable
		const starterRow = page.locator('#subscription li').filter({ hasText: /Starter/i }).first();
		await expect(starterRow.getByRole('button', { name: /Mejorar plan|Cambiar/i })).toHaveCount(
			0
		);
	});

	test('Pro is contact-only (no Checkout)', async ({ page }) => {
		await resetOrgBillingToFreemium(organizationId);
		await gotoOrganization(page);

		const contact = page.getByRole('link', { name: /Contactar a AMRAP/i });
		await expect(contact).toBeVisible();
		await expect(contact).toHaveAttribute('href', /\/es#contact$/);
		await expect(page.locator('#subscription iframe')).toHaveCount(0);
	});

	test('Manage billing opens Customer Portal in a new tab', async ({ page, context }) => {
		const seeded = await seedPaidOrg({
			organizationId,
			email: ownerEmail,
			tier: 'STARTER',
			interval: 'MONTH'
		});
		stripeCustomerToCleanup = seeded.customerId;

		await gotoOrganization(page);
		await expect(page.getByRole('button', { name: /Gestionar facturación/i })).toBeVisible();

		const popupPromise = context.waitForEvent('page', { timeout: 30_000 });
		await clickManageBilling(page);
		const portal = await popupPromise;
		await portal.waitForLoadState('domcontentloaded');
		expect(portal.url()).toMatch(/billing\.stripe\.com|checkout\.stripe\.com|stripe\.com/i);
		await portal.close();
	});

	test('cancel subscription + webhook → Freemium', async ({ page, baseURL }) => {
		test.skip(
			!hasStripeWebhookSecret() || !baseURL,
			'Requires STRIPE_WEBHOOK_SECRET=whsec_… (stripe listen) to POST subscription.deleted'
		);

		const seeded = await seedPaidOrg({
			organizationId,
			email: ownerEmail,
			tier: 'STARTER',
			interval: 'MONTH'
		});
		stripeCustomerToCleanup = seeded.customerId;

		const canceled = await cancelSubscription(seeded.subscriptionId);
		await postSubscriptionDeletedWebhook(baseURL!, canceled);

		await waitForOrgPlan(organizationId, 'FREEMIUM');
		const billing = await readOrgBilling(organizationId);
		expect(billing.stripe_subscription_id).toBeNull();
		expect(billing.billing_interval).toBeNull();

		await gotoOrganization(page);
		await expectCurrentPlan(page, 'FREEMIUM');
	});

	test('canceled stale subscription id opens Embedded Checkout again', async ({ page }) => {
		const seeded = await seedPaidOrg({
			organizationId,
			email: ownerEmail,
			tier: 'STARTER',
			interval: 'MONTH'
		});
		stripeCustomerToCleanup = seeded.customerId;

		await cancelSubscription(seeded.subscriptionId);
		// Leave stale ids as if webhook never ran (canceled but still stored).
		await writeOrgBilling(organizationId, {
			plan_tier: 'STARTER',
			stripe_customer_id: seeded.customerId,
			stripe_subscription_id: seeded.subscriptionId,
			stripe_subscription_status: 'CANCELED',
			billing_interval: 'MONTH'
		});

		await gotoOrganization(page);
		await openPlanConfirm(page, 'GROWTH');
		await chooseBillingInterval(page, 'month');
		await submitPlanConfirm(page);

		// Should open Embedded Checkout, not flash upgradeSuccess
		await waitForEmbeddedCheckout(page);
		await expect(page.getByText(/Suscripción actualizada|Subscription updated/i)).toHaveCount(0);
	});

	test('staff without manage_billing cannot use org billing UI', async () => {
		test.skip(true, 'No staff storageState fixture yet — add when e2e/staff lands');
	});
});
