/**
 * Stripe Tax settings for AMRAP org subscriptions (MXN, Mexico IVA first).
 *
 * Catalog list prices are **exclusive of tax** (landing: “Precios sin IVA”).
 * Checkout / invoices add tax via Stripe Tax when a registration is active
 * (Dashboard → Tax → Registrations → Mexico).
 *
 * Product tax code: SaaS — business use. Confirm with your tax advisor if needed:
 * https://docs.stripe.com/tax/tax-codes
 */
export const AMRAP_PRODUCT_TAX_CODE = 'txcd_10103001' as const;

/** Display prices do not include tax; Stripe Tax adds IVA (etc.) at checkout. */
export const AMRAP_PRICE_TAX_BEHAVIOR = 'exclusive' as const;

/** Params for Checkout Sessions that collect address + RFC/VAT ID when relevant. */
export function checkoutTaxParams() {
	return {
		automatic_tax: { enabled: true },
		tax_id_collection: { enabled: true },
		customer_update: {
			address: 'auto' as const,
			name: 'auto' as const
		}
	};
}

/** Enable automatic tax on Subscription create/update (clear any manual tax_rates first). */
export function subscriptionTaxParams() {
	return {
		automatic_tax: { enabled: true }
	};
}
