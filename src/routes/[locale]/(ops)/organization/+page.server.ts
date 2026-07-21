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
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (!canInWorkspace(workspace, 'manage_billing')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			organizationName: '',
			planTier: workspace.planTier,
			hasStripeCustomer: false,
			billingFlash: null as 'success' | 'cancel' | null,
			gyms: []
		};
	}

	const supabase = createClient();
	const [{ data: gymRows }, { data: orgBilling }] = await Promise.all([
		supabase
			.from('gyms')
			.select('id, name, deleted_at, created_at')
			.eq('organization_id', workspace.organizationId)
			.order('created_at', { ascending: true }),
		supabase
			.from('organizations')
			.select('stripe_customer_id')
			.eq('id', workspace.organizationId)
			.maybeSingle()
	]);

	const gyms = (gymRows ?? []).map((g) => ({
		id: g.id,
		name: g.name,
		deleted_at: g.deleted_at,
		isCurrent: g.id === workspace.gymId
	}));

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
		billingFlash,
		gyms
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
