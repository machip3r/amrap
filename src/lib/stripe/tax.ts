import type Stripe from 'stripe';
import { getStripe } from '$lib/stripe/server';

/**
 * Manual Mexico IVA (16%) until Stripe Tax + SAT registration is available.
 * List prices stay exclusive; Checkout / subscriptions attach this Tax Rate.
 *
 * Do **not** mix with `automatic_tax` — Stripe rejects that combination.
 */
export const MX_IVA_PERCENT = 16;
export const MX_IVA_META_KEY = 'amrap_tax';
export const MX_IVA_META_VALUE = 'mx_iva_16';

let cachedIvaTaxRateId: string | null = null;

/** Find or create the active exclusive 16% IVA Tax Rate in the current Stripe mode. */
export async function ensureMxIvaTaxRateId(): Promise<string> {
	if (cachedIvaTaxRateId) return cachedIvaTaxRateId;

	const stripe = getStripe();
	const existing = await stripe.taxRates.list({ active: true, limit: 100 });
	const match = existing.data.find(
		(r) =>
			r.metadata?.[MX_IVA_META_KEY] === MX_IVA_META_VALUE ||
			(r.percentage === MX_IVA_PERCENT &&
				r.inclusive === false &&
				(r.country === 'MX' || r.display_name?.toUpperCase().includes('IVA')))
	);

	if (match) {
		cachedIvaTaxRateId = match.id;
		return match.id;
	}

	const created = await stripe.taxRates.create({
		display_name: 'IVA',
		description: 'IVA México 16% (AMRAP)',
		percentage: MX_IVA_PERCENT,
		inclusive: false,
		country: 'MX',
		jurisdiction: 'MX',
		tax_type: 'vat',
		metadata: {
			[MX_IVA_META_KEY]: MX_IVA_META_VALUE
		}
	});

	cachedIvaTaxRateId = created.id;
	return created.id;
}

/** Checkout Session fields for manual IVA (no Stripe Tax / automatic_tax). */
export async function checkoutManualIvaParams(): Promise<{
	lineItemTaxRates: string[];
	subscriptionDefaultTaxRates: string[];
}> {
	const id = await ensureMxIvaTaxRateId();
	return {
		lineItemTaxRates: [id],
		subscriptionDefaultTaxRates: [id]
	};
}

/** Apply IVA on Subscription create/update. */
export async function subscriptionManualIvaParams(): Promise<
	Pick<Stripe.SubscriptionUpdateParams, 'default_tax_rates'>
> {
	const id = await ensureMxIvaTaxRateId();
	return { default_tax_rates: [id] };
}
