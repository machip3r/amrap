#!/usr/bin/env node
/**
 * Sync AMRAP Stripe catalog tax settings:
 * - Product tax_code = SaaS business (txcd_10103001)
 * - Price tax_behavior = exclusive (list prices without IVA)
 *
 * Usage:
 *   node --env-file=.env scripts/stripe-sync-catalog-tax.mjs
 *   node --env-file=.env.preview scripts/stripe-sync-catalog-tax.mjs
 *   node --env-file=.env.prod scripts/stripe-sync-catalog-tax.mjs
 *
 * Optional: keep product tax_code / exclusive tax_behavior in sync for a future
 * Stripe Tax migration. Current billing uses a **manual IVA 16% Tax Rate**
 * (`scripts/stripe-ensure-mx-iva-tax-rate.mjs`) — no SAT / Tax Registrations needed.
 */
import Stripe from 'stripe';

const TAX_CODE = 'txcd_10103001';
const TAX_BEHAVIOR = 'exclusive';
const LOOKUPS = [
	'starter_mxn_monthly',
	'starter_mxn_annual',
	'growth_mxn_monthly',
	'growth_mxn_annual'
];

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
	console.error('Missing STRIPE_SECRET_KEY');
	process.exit(1);
}

const stripe = new Stripe(key, { typescript: true });
const mode = key.startsWith('sk_live') ? 'live' : 'test';
console.log(`Syncing tax on ${mode} catalog…`);

for (const lookup_key of LOOKUPS) {
	const listed = await stripe.prices.list({ lookup_keys: [lookup_key], active: true, limit: 1 });
	const price = listed.data[0];
	if (!price) {
		console.warn(`MISSING price lookup_key=${lookup_key}`);
		continue;
	}

	const productId = typeof price.product === 'string' ? price.product : price.product.id;
	await stripe.products.update(productId, { tax_code: TAX_CODE });
	console.log(`product ${productId} tax_code=${TAX_CODE}`);

	if (price.tax_behavior === TAX_BEHAVIOR) {
		console.log(`price ${price.id} (${lookup_key}) already ${TAX_BEHAVIOR}`);
		continue;
	}

	if (price.tax_behavior && price.tax_behavior !== 'unspecified') {
		// Immutable once set to inclusive/exclusive — clone with transferred lookup key.
		const created = await stripe.prices.create({
			product: productId,
			currency: price.currency,
			unit_amount: price.unit_amount ?? undefined,
			recurring: price.recurring
				? {
						interval: price.recurring.interval,
						interval_count: price.recurring.interval_count ?? undefined
					}
				: undefined,
			tax_behavior: TAX_BEHAVIOR,
			lookup_key,
			transfer_lookup_key: true,
			metadata: price.metadata
		});
		await stripe.prices.update(price.id, { active: false });
		console.log(`price ${lookup_key}: replaced ${price.id} → ${created.id} (${TAX_BEHAVIOR})`);
		continue;
	}

	await stripe.prices.update(price.id, { tax_behavior: TAX_BEHAVIOR });
	console.log(`price ${price.id} (${lookup_key}) tax_behavior=${TAX_BEHAVIOR}`);
}

const regs = await stripe.tax.registrations.list({ status: 'active', limit: 20 }).catch(() => ({
	data: []
}));
const mx = regs.data.filter((r) => r.country === 'MX');
if (mx.length === 0) {
	console.log(
		'\nNote: no Stripe Tax MX registration (expected until SAT). Billing uses manual IVA Tax Rate.'
	);
} else {
	console.log(`\nActive MX Stripe Tax registrations: ${mx.length}`);
}

console.log('done');
