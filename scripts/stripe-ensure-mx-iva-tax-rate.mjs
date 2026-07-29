#!/usr/bin/env node
/**
 * Ensure a manual Mexico IVA 16% Tax Rate exists (no Stripe Tax / SAT needed).
 *
 * Usage:
 *   node --env-file=.env scripts/stripe-ensure-mx-iva-tax-rate.mjs
 *   node --env-file=.env.preview scripts/stripe-ensure-mx-iva-tax-rate.mjs
 *   node --env-file=.env.prod scripts/stripe-ensure-mx-iva-tax-rate.mjs
 */
import Stripe from 'stripe';

const META_KEY = 'amrap_tax';
const META_VALUE = 'mx_iva_16';
const PERCENT = 16;

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
	console.error('Missing STRIPE_SECRET_KEY');
	process.exit(1);
}

const stripe = new Stripe(key, { typescript: true });
const mode = key.startsWith('sk_live') ? 'live' : 'test';
console.log(`Ensuring MX IVA Tax Rate (${mode})…`);

const existing = await stripe.taxRates.list({ active: true, limit: 100 });
const match = existing.data.find(
	(r) =>
		r.metadata?.[META_KEY] === META_VALUE ||
		(r.percentage === PERCENT &&
			r.inclusive === false &&
			(r.country === 'MX' || r.display_name?.toUpperCase().includes('IVA')))
);

if (match) {
	console.log('exists', match.id, match.display_name, `${match.percentage}%`);
	process.exit(0);
}

const created = await stripe.taxRates.create({
	display_name: 'IVA',
	description: 'IVA México 16% (AMRAP)',
	percentage: PERCENT,
	inclusive: false,
	country: 'MX',
	jurisdiction: 'MX',
	tax_type: 'vat',
	metadata: { [META_KEY]: META_VALUE }
});

console.log('created', created.id);
