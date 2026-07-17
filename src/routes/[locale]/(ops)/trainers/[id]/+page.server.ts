import { error, redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { loadTeamMemberById } from '$lib/team/queries';
import { removeTeamMemberAction } from '$lib/server/team/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { locale } = await parent();
	const workspace = await getWorkspace();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const d = getDictionary(locale as Locale);

	if (!canInWorkspace(workspace, 'manage_staff')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			member: null,
			listRole: 'trainer' as const,
			isSelf: false
		};
	}

	const supabase = createClient();
	const member = await loadTeamMemberById(supabase, workspace.gymId, params.id, 'TRAINER');
	if (!member) error(404, d.trainers.notFound);

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		member,
		listRole: 'trainer' as const,
		isSelf: member.userId === workspace.userId
	};
};

export const actions = {
	remove: async ({ request }) => {
		await removeTeamMemberAction(await request.formData());
	}
} satisfies Actions;
