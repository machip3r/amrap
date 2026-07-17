import { fail, redirect } from '@sveltejs/kit';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { loadOpsDashboard, loadTrainerDashboard } from '$lib/server/dashboard/load';
import { createMember, type CreateMemberState } from '$lib/server/members/actions';
import { createStaffOrTrainer, type CreateTeamMemberState } from '$lib/server/team/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, depends }) => {
	depends(OPS_LOAD_DEPS.dashboard);
	const { locale, workspace } = await parent();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const d = getDictionary(locale as Locale);

	if (workspace.role === 'TRAINER' && !workspace.canActAsOwner) {
		return {
			d,
			dashboard: await loadTrainerDashboard(locale as Locale, workspace, d.dashboard)
		};
	}

	return {
		d,
		dashboard: await loadOpsDashboard(locale as Locale, workspace, d)
	};
};

export const actions = {
	createMember: async ({ request }) => {
		const result = await createMember(await request.formData());
		if (result?.success) return result as CreateMemberState;
		return fail(400, (result ?? { error: 'error' }) as CreateMemberState);
	},
	createTeam: async ({ request }) => {
		const result = await createStaffOrTrainer(await request.formData());
		if (result?.success) return result as CreateTeamMemberState;
		return fail(400, (result ?? { error: 'error' }) as CreateTeamMemberState);
	}
} satisfies Actions;
