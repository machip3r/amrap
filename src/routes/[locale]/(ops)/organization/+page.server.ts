import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	cancelGymDeletion,
	requestCreateGym,
	requestSubscriptionCheckout,
	scheduleGymDeletion,
	scheduleOrganizationDeletion,
	type OrgActionState
} from '$lib/server/organization/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
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
			gyms: []
		};
	}

	const supabase = createClient();
	const { data: gymRows } = await supabase
		.from('gyms')
		.select('id, name, deleted_at, created_at')
		.eq('organization_id', workspace.organizationId)
		.order('created_at', { ascending: true });

	const gyms = (gymRows ?? []).map((g) => ({
		id: g.id,
		name: g.name,
		deleted_at: g.deleted_at,
		isCurrent: g.id === workspace.gymId
	}));

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		organizationName: workspace.organizationName || workspace.gymName,
		planTier: workspace.planTier,
		gyms
	};
};

export const actions = {
	checkout: async ({ request }) =>
		requestSubscriptionCheckout(await request.formData()) as OrgActionState,
	createGym: async ({ request }) => requestCreateGym(await request.formData()) as OrgActionState,
	deleteGym: async ({ request }) => scheduleGymDeletion(await request.formData()) as OrgActionState,
	cancelGymDelete: async ({ request }) =>
		cancelGymDeletion(await request.formData()) as OrgActionState,
	deleteOrg: async ({ request }) =>
		scheduleOrganizationDeletion(await request.formData()) as OrgActionState
} satisfies Actions;
