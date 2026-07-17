import { error, fail } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import { listTodayCheckIns } from '$lib/checkin/queries';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import {
	confirmCheckIn,
	runCheckIn,
	searchCheckInCandidates,
	walkInEnroll
} from '$lib/server/checkin/actions';
import { createClient } from '$lib/supabase/server';
import { formString } from '$lib/validation/schemas';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, depends }) => {
	depends(OPS_LOAD_DEPS.checkin);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);

	if (!workspace || !canInWorkspace(workspace, 'checkin')) {
		error(403, d.common.forbidden);
	}

	const canManageMembers = canInWorkspace(workspace, 'manage_members');
	const supabase = createClient();
	const todayCheckIns = await listTodayCheckIns(supabase, workspace.gymId);

	return {
		locale,
		d,
		canManageMembers,
		todayCheckIns
	};
};

export const actions: Actions = {
	search: async ({ request }) => {
		const formData = await request.formData();
		const result = await searchCheckInCandidates(formString(formData, 'code'));
		return { result };
	},

	confirm: async ({ request }) => {
		const formData = await request.formData();
		const result = await confirmCheckIn(formString(formData, 'membershipId'));
		return { result };
	},

	scan: async ({ request }) => {
		const formData = await request.formData();
		const result = await runCheckIn(formString(formData, 'code'));
		return { result };
	},

	walkIn: async ({ request }) => {
		const formData = await request.formData();
		const result = await walkInEnroll(
			formString(formData, 'sessionId'),
			formString(formData, 'personId')
		);
		if (!result.ok) return fail(400, { result });
		return { result };
	}
};
