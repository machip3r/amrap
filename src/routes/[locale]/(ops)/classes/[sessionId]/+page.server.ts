import { error, redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import { loadSessionRoster } from '$lib/classes/queries';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import {
	bookClassForMember,
	cancelBookingStaff,
	cancelClassSession,
	setBookingStatusStaff,
	upsertSessionResult
} from '$lib/server/classes/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params, depends }) => {
	depends(OPS_LOAD_DEPS.classes);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (
		!canInWorkspace(workspace, 'manage_classes') &&
		!canInWorkspace(workspace, 'checkin')
	) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			session: null,
			bookings: [],
			memberOptions: [],
			canManage: false,
			canCheckin: false
		};
	}

	const supabase = createClient();
	const roster = await loadSessionRoster(supabase, params.sessionId);
	if (!roster || roster.session.gym_id !== workspace.gymId) {
		throw error(404, 'Not found');
	}

	const canManage = canInWorkspace(workspace, 'manage_classes');
	const canCheckin = canInWorkspace(workspace, 'checkin') || canManage;

	const { data: members } = await supabase
		.from('memberships')
		.select('person_id, persons ( id, full_name )')
		.eq('gym_id', workspace.gymId)
		.eq('status', 'ACTIVE')
		.gte('expires_at', new Date().toISOString())
		.limit(200);

	const memberOptions = (members ?? [])
		.map((m) => {
			const p = Array.isArray(m.persons) ? m.persons[0] : m.persons;
			return {
				personId: m.person_id as string,
				name: (p as { full_name?: string } | null)?.full_name ?? ''
			};
		})
		.filter((m) => m.name)
		.sort((a, b) => a.name.localeCompare(b.name));

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		session: roster.session,
		bookings: roster.bookings,
		memberOptions,
		canManage,
		canCheckin
	};
};

export const actions = {
	cancelSession: async ({ request }) => {
		await cancelClassSession(await request.formData());
	},
	bookMember: async ({ request }) => bookClassForMember(await request.formData()),
	cancelBooking: async ({ request }) => {
		await cancelBookingStaff(await request.formData());
	},
	setBookingStatus: async ({ request }) => {
		await setBookingStatusStaff(await request.formData());
	},
	upsertResult: async ({ request }) => upsertSessionResult(await request.formData())
} satisfies Actions;
