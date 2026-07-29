import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { getMemberContext, MEMBER_GYM_COOKIE } from '$lib/auth/member-session';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { createServiceRoleClient } from '$lib/supabase/admin';
import { formString, localeSchema, uuidSchema } from '$lib/validation/schemas';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

export type MemberActionState = {
	error?: string;
	success?: boolean;
} | null;

export async function bookSession(formData: FormData): Promise<MemberActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const member = await getMemberContext();
	if (!member) return { error: d.common.forbidden };

	const sessionId = uuidSchema.safeParse(formString(formData, 'session_id'));
	if (!sessionId.success) return { error: d.validation.invalid };

	const supabase = createClient();
	const { error } = await supabase.rpc('book_class_session', {
		p_session_id: sessionId.data,
		p_person_id: null,
		p_membership_id: null
	});
	if (error) {
		console.error('bookSession', error.message);
		return { error: d.member.bookError };
	}

	return { success: true };
}

export async function cancelBooking(formData: FormData): Promise<MemberActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const member = await getMemberContext();
	if (!member) return { error: d.common.forbidden };

	const bookingId = uuidSchema.safeParse(formString(formData, 'booking_id'));
	if (!bookingId.success) return { error: d.validation.invalid };

	const supabase = createClient();
	const { error } = await supabase.rpc('cancel_class_booking', {
		p_booking_id: bookingId.data
	});
	if (error) {
		console.error('cancelBooking', error.message);
		return { error: d.member.cancelError };
	}

	return { success: true };
}

export async function switchMemberGymAction(formData: FormData): Promise<void> {
	const locale = localeFromForm(formData);
	const member = await getMemberContext();
	if (!member) return;

	const gymId = uuidSchema.safeParse(formString(formData, 'gym_id'));
	if (!gymId.success) return;
	if (!member.gyms.some((g) => g.gymId === gymId.data)) return;

	getRequestEvent().cookies.set(MEMBER_GYM_COOKIE, gymId.data, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		secure: !dev,
		maxAge: 60 * 60 * 24 * 365
	});

	throw redirect(303, `/${locale}/me`);
}

/**
 * Member self-cancel: ends access now (`CANCELLED` + `expires_at = now`).
 * Uses service role because memberships RLS WITH CHECK is staff-only.
 */
export async function cancelMembershipAction(
	formData: FormData
): Promise<{ error?: string; intent: 'cancel' } | void> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const member = await getMemberContext();
	if (!member) return { error: d.common.forbidden, intent: 'cancel' };

	const active = member.gyms.find((g) => g.gymId === member.activeGymId);
	if (!active) return { error: d.common.forbidden, intent: 'cancel' };

	const admin = createServiceRoleClient();
	if (!admin) return { error: d.common.saveFailed, intent: 'cancel' };

	const nowIso = new Date().toISOString();
	const { data: updated, error } = await admin
		.from('memberships')
		.update({
			status: 'CANCELLED',
			expires_at: nowIso,
			updated_at: nowIso
		})
		.eq('id', active.membershipId)
		.eq('person_id', member.personId)
		.eq('gym_id', active.gymId)
		.select('id')
		.maybeSingle();

	if (error || !updated) {
		console.error('cancelMembership', error?.message ?? 'no row');
		return { error: d.member.cancelMembershipError, intent: 'cancel' };
	}

	const remaining = member.gyms.filter((g) => g.gymId !== active.gymId);
	const event = getRequestEvent();
	if (remaining.length > 0) {
		event.cookies.set(MEMBER_GYM_COOKIE, remaining[0]!.gymId, {
			path: '/',
			sameSite: 'lax',
			httpOnly: true,
			secure: !dev,
			maxAge: 60 * 60 * 24 * 365
		});
		throw redirect(303, `/${locale}/me`);
	}

	event.cookies.delete(MEMBER_GYM_COOKIE, { path: '/' });
	throw redirect(303, `/${locale}/no-access`);
}
