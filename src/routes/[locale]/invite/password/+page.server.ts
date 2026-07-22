import { error, redirect } from '@sveltejs/kit';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { userNeedsInvitePassword } from '$lib/auth/invite-password';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { getSessionUser } from '$lib/auth/session';
import { resolveInviteFlowBrand } from '$lib/branding/auth-shell';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	setInvitePasswordAction,
	type InvitePasswordState
} from '$lib/server/invite/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	if (await getPendingInvite()) throw redirect(303, invitePath(locale));

	if (!(await userNeedsInvitePassword(user))) {
		throw redirect(303, await resolvePostAuthPath(locale));
	}

	const brand = await resolveInviteFlowBrand();

	return { locale, d, hasSession: true, brand };
};

export const actions = {
	setPassword: async ({ request }) =>
		setInvitePasswordAction(await request.formData()) as InvitePasswordState
} satisfies Actions;
