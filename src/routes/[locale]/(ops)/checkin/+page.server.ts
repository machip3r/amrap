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
import { createMember, type CreateMemberState } from '$lib/server/members/actions';
import { createStaffOrTrainer, type CreateTeamMemberState } from '$lib/server/team/actions';
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
	const canManageStaff = canInWorkspace(workspace, 'manage_staff');
	const supabase = createClient();
	const todayCheckIns = await listTodayCheckIns(supabase, workspace.gymId);

	let registerPlans: { id: string; name: string; price: number; duration_days: number }[] = [];
	if (canManageMembers) {
		const { data: planRows } = await supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', workspace.gymId)
			.eq('is_active', true)
			.order('created_at', { ascending: false });
		registerPlans = (planRows ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			price: Number(p.price),
			duration_days: p.duration_days
		}));
	}

	return {
		locale,
		d,
		canManageMembers,
		canManageStaff,
		registerPlans,
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
		const result = await confirmCheckIn(formString(formData, 'membershipId'), {
			kiosk: formString(formData, 'kiosk') === '1'
		});
		return { result };
	},

	scan: async ({ request }) => {
		const formData = await request.formData();
		const result = await runCheckIn(formString(formData, 'code'), {
			kiosk: formString(formData, 'kiosk') === '1'
		});
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
	},

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
};
