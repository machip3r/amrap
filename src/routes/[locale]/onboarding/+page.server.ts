import { error, redirect } from '@sveltejs/kit';
import { getMemberContext } from '$lib/auth/member-session';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import {
	isNonOwnerInvitee,
	needsOwnerOnboarding,
	resolvePostAuthPath
} from '$lib/auth/post-auth-redirect';
import {
	getOnboardingState,
	getSessionUser,
	getWorkspace
} from '$lib/auth/session';
import type { Locale } from '$lib/i18n/config';
import { isLocale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	addOnboardingPlanAction,
	deleteOnboardingPlanAction,
	finishOnboardingAction,
	saveOnboardingGymAction,
	saveOnboardingProfileAction,
	skipOnboardingPlansAction,
	updateOnboardingPlanAction,
	type OnboardingActionState
} from '$lib/server/onboarding/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	// Register / OTP land here — fetch gates in one round instead of a waterfall.
	const [invite, invitee, state, workspace] = await Promise.all([
		getPendingInvite(),
		isNonOwnerInvitee(),
		getOnboardingState(),
		getWorkspace()
	]);

	if (invite) {
		throw redirect(303, invitePath(locale));
	}

	if (invitee) {
		throw redirect(303, await resolvePostAuthPath(locale));
	}

	if (!state) throw redirect(303, `/${locale}/login`);

	if (workspace && !(await needsOwnerOnboarding(state))) {
		throw redirect(303, `/${locale}/dashboard`);
	}

	if (!state.organizationId) {
		const member = await getMemberContext();
		if (member) throw redirect(303, `/${locale}/me`);
	}

	if (!state.organizationId) {
		if (url.searchParams.get('error') === 'org') {
			return { locale, d, orgError: true as const };
		}
		throw redirect(303, `/auth/ensure-organization?locale=${locale}`);
	}

	if (state.completed && workspace) {
		throw redirect(303, `/${locale}/dashboard`);
	}

	let plans: { id: string; name: string; price: number; duration_days: number }[] = [];
	if (state.gymId) {
		const supabase = createClient();
		const { data } = await supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', state.gymId)
			.eq('is_active', true)
			.order('created_at', { ascending: true })
			.limit(2);
		plans = (data ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			price: Number(p.price),
			duration_days: p.duration_days
		}));
	}

	return { locale, d, state, plans, showError: url.searchParams.has('error') };
};

export const actions = {
	saveProfile: async ({ request }) =>
		saveOnboardingProfileAction(await request.formData()) as OnboardingActionState,
	saveGym: async ({ request }) =>
		saveOnboardingGymAction(await request.formData()) as OnboardingActionState,
	addPlan: async ({ request }) =>
		addOnboardingPlanAction(await request.formData()) as OnboardingActionState,
	updatePlan: async ({ request }) =>
		updateOnboardingPlanAction(await request.formData()) as OnboardingActionState,
	deletePlan: async ({ request }) => deleteOnboardingPlanAction(await request.formData()),
	skipPlans: async ({ request }) => skipOnboardingPlansAction(await request.formData()),
	finish: async ({ request }) => finishOnboardingAction(await request.formData())
} satisfies Actions;
