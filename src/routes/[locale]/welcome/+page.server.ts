import { error, redirect } from '@sveltejs/kit';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import { needsOwnerOnboarding, noAccessPath, resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import {
	getPersonProfileStatus,
	resolveWelcomeRole
} from '$lib/auth/profile-onboarding';
import { getOnboardingState, getSessionUser } from '$lib/auth/session';
import { resolveInviteFlowBrand } from '$lib/branding/auth-shell';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { completeWelcomeProfileAction, type WelcomeActionState } from '$lib/server/welcome/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	if (await getPendingInvite()) throw redirect(303, invitePath(locale));

	const onboarding = await getOnboardingState();
	if (await needsOwnerOnboarding(onboarding)) {
		throw redirect(303, `/${locale}/onboarding`);
	}

	const profile = await getPersonProfileStatus();
	if (!profile) throw redirect(303, await resolvePostAuthPath(locale));
	if (profile.profileCompleted) throw redirect(303, await resolvePostAuthPath(locale));

	const role = await resolveWelcomeRole();
	if (!role) throw redirect(303, noAccessPath(locale));

	const title =
		role === 'trainer'
			? d.welcome.titleTrainer
			: role === 'member'
				? d.welcome.titleMember
				: d.welcome.titleStaff;
	const subtitle =
		role === 'trainer'
			? d.welcome.subtitleTrainer
			: role === 'member'
				? d.welcome.subtitleMember
				: d.welcome.subtitleStaff;

	const brand = await resolveInviteFlowBrand();

	return {
		locale,
		d,
		role,
		title,
		subtitle,
		brand,
		defaultDateOfBirth: profile.dateOfBirth,
		defaultGender: profile.gender,
		defaultHeightCm: profile.heightCm,
		defaultWeightKg: profile.weightKg
	};
};

export const actions = {
	completeProfile: async ({ request }) =>
		completeWelcomeProfileAction(await request.formData()) as WelcomeActionState
} satisfies Actions;
