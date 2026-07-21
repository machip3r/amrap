import { error, redirect } from '@sveltejs/kit';
import { getMemberContext } from '$lib/auth/member-session';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import {
	isNonOwnerInvitee,
	needsOwnerOnboarding
} from '$lib/auth/post-auth-redirect';
import {
	getPersonProfileStatus,
	welcomePath
} from '$lib/auth/profile-onboarding';
import { getOnboardingState, getSessionUser, getWorkspace } from '$lib/auth/session';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	const [invite, onboarding, profile, workspace, invitee, member] = await Promise.all([
		getPendingInvite(),
		getOnboardingState(),
		getPersonProfileStatus(),
		getWorkspace(),
		isNonOwnerInvitee(),
		getMemberContext()
	]);

	if (invite) throw redirect(303, invitePath(locale));

	if (await needsOwnerOnboarding(onboarding)) {
		throw redirect(303, `/${locale}/onboarding`);
	}

	if (profile && !profile.profileCompleted && (workspace || member || invitee)) {
		throw redirect(303, welcomePath(locale));
	}

	if (workspace) throw redirect(303, `/${locale}/dashboard`);
	if (member) throw redirect(303, `/${locale}/me`);

	// Still mid owner setup with an org but no gym yet — finish onboarding.
	if (onboarding?.organizationId && !onboarding.completed) {
		throw redirect(303, `/${locale}/onboarding`);
	}

	return {
		locale,
		d,
		title: d.noAccess.title,
		body: d.noAccess.body
	};
};
