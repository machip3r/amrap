import { redirect } from '@sveltejs/kit';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { loadTeamListPage } from '$lib/server/team/load';
import {
	createStaffOrTrainer,
	removeTeamMemberAction,
	type CreateTeamMemberState
} from '$lib/server/team/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url, depends }) => {
	depends(OPS_LOAD_DEPS.team);
	const { locale, workspace } = await parent();
	if (!workspace) throw redirect(303, `/${locale}/login`);
	return loadTeamListPage(locale, 'staff', url, workspace);
};

export const actions = {
	create: async ({ request }) =>
		createStaffOrTrainer(await request.formData()) as CreateTeamMemberState,
	remove: async ({ request }) => {
		await removeTeamMemberAction(await request.formData());
	}
} satisfies Actions;
