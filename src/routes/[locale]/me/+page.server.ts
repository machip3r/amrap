import { switchMemberGymAction } from '$lib/server/member/actions';
import type { Actions } from './$types';

export const actions = {
	switchGym: async ({ request }) => switchMemberGymAction(await request.formData())
} satisfies Actions;
