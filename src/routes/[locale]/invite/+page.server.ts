import { error, redirect } from '@sveltejs/kit';
import { getPendingInvite } from '$lib/auth/invite-decision';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { getSessionUser } from '$lib/auth/session';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	acceptInviteAction,
	declineInviteAction,
	type InviteDecideState
} from '$lib/server/invite/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	const invite = await getPendingInvite();
	if (!invite) throw redirect(303, await resolvePostAuthPath(locale));

	const roleLabel =
		invite.role === 'TRAINER'
			? d.invite.roleTrainer
			: invite.role === 'STAFF'
				? d.invite.roleStaff
				: d.invite.roleMember;

	const headline = d.invite.title.replace('{gym}', invite.gymName).replace('{role}', roleLabel);
	const body = d.invite.subtitle.replace('{gym}', invite.gymName).replace('{role}', roleLabel);

	return { locale, d, headline, body };
};

export const actions = {
	accept: async ({ request }) => acceptInviteAction(await request.formData()) as InviteDecideState,
	decline: async ({ request }) => declineInviteAction(await request.formData()) as InviteDecideState
} satisfies Actions;
