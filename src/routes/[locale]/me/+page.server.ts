import { switchMemberGymAction } from '$lib/server/member/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { member } = await parent();
	return {
		gyms: member.gyms
	};
};

export const actions = {
	switchGym: async ({ request }) => switchMemberGymAction(await request.formData())
} satisfies Actions;
