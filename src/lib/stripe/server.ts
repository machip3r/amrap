import Stripe from 'stripe';
import { getStripeSecretKey } from '$lib/stripe/env';

let stripe: Stripe | null = null;

/** Server-only Stripe client. Latest API version from the SDK. */
export function getStripe(): Stripe {
	const key = getStripeSecretKey();
	if (!key) {
		throw new Error('Missing STRIPE_SECRET_KEY');
	}
	if (!stripe) {
		stripe = new Stripe(key, {
			typescript: true
		});
	}
	return stripe;
}
