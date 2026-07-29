import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	cancelGymDeletion,
	requestBillingPortal,
	requestCreateGym,
	requestSubscriptionCheckout,
	scheduleGymDeletion,
	scheduleOrganizationDeletion,
	type OrgActionState
} from '$lib/server/organization/actions';
import { getStripePublishableKey } from '$lib/stripe/env';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const stripePublishableKey = getStripePublishableKey() ?? null;

	if (!canInWorkspace(workspace, 'manage_billing')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			organizationName: '',
			planTier: workspace.planTier,
			hasStripeCustomer: false,
			subscriptionCancelAt: null as string | null,
			subscriptionCancelAtPeriodEnd: false,
			billingFlash: null as 'success' | 'cancel' | null,
			stripePublishableKey,
			gyms: [],
			feedback: [] as {
				id: string;
				body: string;
				createdAt: string;
				authorName: string | null;
			}[],
			activeGymName: workspace.gymName
		};
	}

	const supabase = createClient();
	const [{ data: gymRows }, { data: orgBilling }, { data: feedbackRows }] = await Promise.all([
		supabase
			.from('gyms')
			.select('id, name, deleted_at, created_at')
			.eq('organization_id', workspace.organizationId)
			.order('created_at', { ascending: true }),
		supabase
			.from('organizations')
			.select('stripe_customer_id, stripe_cancel_at_period_end, stripe_cancel_at')
			.eq('id', workspace.organizationId)
			.maybeSingle(),
		supabase
			.from('feedback_messages')
			.select('id, body, created_at, author_person_id, persons ( full_name )')
			.eq('gym_id', workspace.gymId)
			.eq('target', 'GYM')
			.order('created_at', { ascending: false })
			.limit(50)
	]);

	const gyms = (gymRows ?? []).map((g) => ({
		id: g.id,
		name: g.name,
		deleted_at: g.deleted_at,
		isCurrent: g.id === workspace.gymId
	}));

	const feedback = (feedbackRows ?? []).map((row) => {
		const person = row.persons;
		const personRow = Array.isArray(person) ? person[0] : person;
		return {
			id: row.id as string,
			body: row.body as string,
			createdAt: row.created_at as string,
			authorName: (personRow as { full_name?: string | null } | null)?.full_name?.trim() || null
		};
	});

	const billingParam = url.searchParams.get('billing');
	const billingFlash: 'success' | 'cancel' | null =
		billingParam === 'success' || billingParam === 'cancel' ? billingParam : null;

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		organizationName: workspace.organizationName || workspace.gymName,
		planTier: workspace.planTier,
		hasStripeCustomer: Boolean(orgBilling?.stripe_customer_id),
		subscriptionCancelAt: orgBilling?.stripe_cancel_at ?? null,
		subscriptionCancelAtPeriodEnd: Boolean(orgBilling?.stripe_cancel_at_period_end),
		billingFlash,
		stripePublishableKey,
		gyms,
		feedback,
		activeGymName: workspace.gymName
	};
};

export const actions = {
	checkout: async ({ request }) =>
		requestSubscriptionCheckout(await request.formData()) as OrgActionState,
	billingPortal: async ({ request }) =>
		requestBillingPortal(await request.formData()) as OrgActionState,
	createGym: async ({ request }) => requestCreateGym(await request.formData()) as OrgActionState,
	deleteGym: async ({ request }) => scheduleGymDeletion(await request.formData()) as OrgActionState,
	cancelGymDelete: async ({ request }) =>
		cancelGymDeletion(await request.formData()) as OrgActionState,
	deleteOrg: async ({ request }) =>
		scheduleOrganizationDeletion(await request.formData()) as OrgActionState
} satisfies Actions;
