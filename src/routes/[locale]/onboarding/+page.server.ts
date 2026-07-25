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
import { maxActivePlans } from '$lib/plans/limits';
import {
	addOnboardingPlanAction,
	deleteOnboardingPlanAction,
	finishOnboardingAction,
	requestSubscriptionCheckout,
	saveOnboardingGymAction,
	saveOnboardingProfileAction,
	skipOnboardingBillingAction,
	skipOnboardingPlansAction,
	updateOnboardingPlanAction,
	type OnboardingActionState
} from '$lib/server/onboarding/actions';
import type { OrgActionState } from '$lib/server/organization/billing';
import { syncOrgFromCheckoutSessionId } from '$lib/server/stripe/sync';
import { getStripePublishableKey } from '$lib/stripe/env';
import { createClient } from '$lib/supabase/server';
import type { OrgPlanTier } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

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

	const sessionId = url.searchParams.get('session_id');
	if (url.searchParams.get('billing') === 'success' && sessionId) {
		await syncOrgFromCheckoutSessionId(sessionId);
	}

	const supabase = createClient();
	const { data: orgRow } = await supabase
		.from('organizations')
		.select('plan_tier, onboarding_billing_done')
		.eq('id', state.organizationId)
		.maybeSingle();

	const planTier = (orgRow?.plan_tier as OrgPlanTier | undefined) ?? 'FREEMIUM';

	// After paid checkout during onboarding, advance past the optional billing step.
	if (
		url.searchParams.get('billing') === 'success' &&
		planTier !== 'FREEMIUM' &&
		!orgRow?.onboarding_billing_done
	) {
		await supabase.rpc('onboarding_mark_billing_done');
		throw redirect(303, `/${locale}/onboarding?billing=success`);
	}
	const planCap = maxActivePlans(planTier);

	let plans: { id: string; name: string; price: number; duration_days: number }[] = [];
	if (state.gymId) {
		const limit = planCap ?? 50;
		const { data } = await supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', state.gymId)
			.eq('is_active', true)
			.order('created_at', { ascending: true })
			.limit(limit);
		plans = (data ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			price: Number(p.price),
			duration_days: p.duration_days
		}));
	}

	return {
		locale,
		d,
		state,
		plans,
		planTier,
		planCap,
		stripePublishableKey: getStripePublishableKey() ?? null,
		billingFlash: url.searchParams.get('billing') === 'success',
		showError: url.searchParams.has('error')
	};
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
	skipBilling: async ({ request }) => skipOnboardingBillingAction(await request.formData()),
	checkout: async ({ request }) =>
		requestSubscriptionCheckout(await request.formData()) as OrgActionState,
	finish: async ({ request }) => finishOnboardingAction(await request.formData())
} satisfies Actions;
