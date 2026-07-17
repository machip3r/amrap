import { loadTeamListPage } from '$lib/server/team/load';
import {
	createStaffOrTrainer,
	removeTeamMemberAction,
	type CreateTeamMemberState
} from '$lib/server/team/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale } = await parent();
	return loadTeamListPage(locale, 'staff', url);
};

export const actions = {
	create: async ({ request }) =>
		createStaffOrTrainer(await request.formData()) as CreateTeamMemberState,
	remove: async ({ request }) => {
		await removeTeamMemberAction(await request.formData());
	}
} satisfies Actions;
