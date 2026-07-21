import { isRedirect, redirect } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { getStripeWebhookSecret } from '$lib/stripe/env';
import { getStripe } from '$lib/stripe/server';
import {
	syncOrganizationFromCheckoutSession,
	syncOrganizationFromSubscription
} from '$lib/server/stripe/sync';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const secret = getStripeWebhookSecret();
	if (!secret) {
		console.error('stripe webhook: missing STRIPE_WEBHOOK_SECRET');
		return new Response('Webhook not configured', { status: 500 });
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return new Response('Missing signature', { status: 400 });
	}

	const rawBody = await request.text();
	let event: Stripe.Event;
	try {
		event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
	} catch (err) {
		console.error('stripe webhook signature', err);
		return new Response('Invalid signature', { status: 400 });
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await syncOrganizationFromCheckoutSession(session);
				if (typeof session.subscription === 'string') {
					const sub = await getStripe().subscriptions.retrieve(session.subscription);
					await syncOrganizationFromSubscription(sub);
				}
				break;
			}
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted': {
				const sub = event.data.object as Stripe.Subscription;
				await syncOrganizationFromSubscription(sub);
				break;
			}
			case 'invoice.paid':
			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice & {
					subscription?: string | Stripe.Subscription | null;
				};
				const fromParent = invoice.parent?.subscription_details?.subscription;
				const subRef = fromParent ?? invoice.subscription;
				const subId = typeof subRef === 'string' ? subRef : subRef?.id;
				if (subId) {
					const sub = await getStripe().subscriptions.retrieve(subId);
					await syncOrganizationFromSubscription(sub);
				}
				break;
			}
			default:
				break;
		}
	} catch (err) {
		if (isRedirect(err)) throw err;
		console.error('stripe webhook handler', event.type, err);
		return new Response('Handler error', { status: 500 });
	}

	return new Response(JSON.stringify({ received: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
