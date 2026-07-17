import { error, redirect } from '@sveltejs/kit';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { needsProfileWelcome, welcomePath } from '$lib/auth/profile-onboarding';
import { getMemberContext } from '$lib/auth/member-session';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;

	const member = await getMemberContext();
	if (!member) throw redirect(303, `/${locale}/login`);

	if (await getPendingInvite()) throw redirect(303, invitePath(locale));
	if (await needsProfileWelcome()) throw redirect(303, welcomePath(locale));

	const d = getDictionary(locale);
	const initial =
		member.fullName?.charAt(0).toUpperCase() ?? member.userId.slice(0, 2).toUpperCase();

	return { locale, d, member, initial };
};
