import type { Locale } from '$lib/i18n/config';
import {
	getOnboardingState,
	getSessionUser,
	getWorkspace,
	type OnboardingState
} from '$lib/auth/session';
import { getMemberContext } from '$lib/auth/member-session';
import { getPendingInvite, invitePath } from '$lib/auth/invite-decision';
import {
	getPersonProfileStatus,
	welcomePath
} from '$lib/auth/profile-onboarding';
import { createClient } from '$lib/supabase/server';
import { getRequestEvent } from '$app/server';

/**
 * Staff/trainer invitee (pending or accepted). These users must never enter
 * gym-owner onboarding or get an organization bootstrapped.
 * Memoized on `event.locals` for the duration of one request.
 */
export async function isInvitedOpsUser(): Promise<boolean> {
	let locals: App.Locals | null = null;
	try {
		locals = getRequestEvent().locals;
	} catch {
		locals = null;
	}
	if (locals?.invitedOpsResolved) {
		return Boolean(locals.invitedOps);
	}

	const user = await getSessionUser();
	if (!user) {
		if (locals) {
			locals.invitedOpsResolved = true;
			locals.invitedOps = false;
		}
		return false;
	}

	const supabase = createClient();
	const { data } = await supabase
		.from('gym_roles')
		.select('id')
		.eq('user_id', user.id)
		.in('role', ['STAFF', 'TRAINER'])
		.in('invite_status', ['pending', 'accepted'])
		// Provisional org creators are STAFF + is_provisional_owner; they must
		// finish owner onboarding, not the invitee /welcome path.
		.eq('is_provisional_owner', false)
		.limit(1)
		.maybeSingle();

	const invited = Boolean(data);
	if (locals) {
		locals.invitedOpsResolved = true;
		locals.invitedOps = invited;
	}
	return invited;
}

/**
 * Member invitee (pending or accepted membership invite). Must never enter
 * owner onboarding or get an organization bootstrapped.
 */
export async function isInvitedMemberUser(): Promise<boolean> {
	let locals: App.Locals | null = null;
	try {
		locals = getRequestEvent().locals;
	} catch {
		locals = null;
	}
	if (locals?.invitedMemberResolved) {
		return Boolean(locals.invitedMember);
	}

	const finish = (invited: boolean) => {
		if (locals) {
			locals.invitedMemberResolved = true;
			locals.invitedMember = invited;
		}
		return invited;
	};

	const user = await getSessionUser();
	if (!user) return finish(false);

	const supabase = createClient();
	const { data: person } = await supabase
		.from('persons')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!person) return finish(false);

	const { data } = await supabase
		.from('memberships')
		.select('id')
		.eq('person_id', person.id)
		.in('invite_status', ['pending', 'accepted'])
		.limit(1)
		.maybeSingle();

	return finish(Boolean(data));
}

/** Staff/trainer or member invitee — never bootstrap an org for these users. */
export async function isNonOwnerInvitee(): Promise<boolean> {
	const [ops, member] = await Promise.all([isInvitedOpsUser(), isInvitedMemberUser()]);
	return ops || member;
}

/**
 * True when this user created an organization and has not finished owner setup.
 * Invited staff/trainers/members must never enter gym owner onboarding — their
 * accepted gym_roles / memberships row would otherwise look like “gym already
 * created” and dump them on the plans step (or bootstrap a new org).
 */
export async function needsOwnerOnboarding(
	onboarding?: OnboardingState | null
): Promise<boolean> {
	const state = onboarding ?? (await getOnboardingState());
	if (!state?.organizationId || state.completed) return false;
	if (await isNonOwnerInvitee()) return false;
	return true;
}

/**
 * Where to send a signed-in user after login, register, invite confirm, etc.
 * One parallel Auth/DB round — avoids sequential gate waterfall before redirect.
 */
export async function resolvePostAuthPath(locale: Locale): Promise<string> {
	const [invite, onboarding, profile, workspace, invitedOps, invitedMember, member] =
		await Promise.all([
			getPendingInvite(),
			getOnboardingState(),
			getPersonProfileStatus(),
			getWorkspace(),
			isInvitedOpsUser(),
			isInvitedMemberUser(),
			getMemberContext()
		]);

	if (invite) {
		return invitePath(locale);
	}

	const invitee = invitedOps || invitedMember;

	if (onboarding?.organizationId && !onboarding.completed && !invitee) {
		return `/${locale}/onboarding`;
	}

	if (profile && !profile.profileCompleted && (workspace || member || invitee)) {
		return welcomePath(locale);
	}

	if (workspace) {
		return `/${locale}/dashboard`;
	}

	if (member) {
		return `/${locale}/me`;
	}

	if (onboarding?.organizationId && !onboarding.completed) {
		return `/${locale}/onboarding`;
	}

	// Signed in but no gym workspace / active membership (expired member,
	// cancelled invite, owner with no gym left, etc.).
	return noAccessPath(locale);
}

export function noAccessPath(locale: Locale): string {
	return `/${locale}/no-access`;
}
