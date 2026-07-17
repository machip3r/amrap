import { bookSession, cancelBooking, type MemberActionState } from '$lib/server/member/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { locale, d, member } = await parent();

	const supabase = createClient();
	const now = new Date();
	const until = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

	const { data: sessionRows } = await supabase
		.from('class_sessions')
		.select(
			`
      id,
      starts_at,
      capacity,
      status,
      classes ( name )
    `
		)
		.eq('gym_id', member.activeGymId)
		.eq('status', 'scheduled')
		.gt('starts_at', now.toISOString())
		.lte('starts_at', until.toISOString())
		.order('starts_at', { ascending: true });

	const sessionIds = (sessionRows ?? []).map((s) => s.id as string);

	const { data: allBookings } = sessionIds.length
		? await supabase
				.from('class_bookings')
				.select('id, session_id, person_id, status')
				.in('session_id', sessionIds)
				.neq('status', 'cancelled')
		: {
				data: [] as { id: string; session_id: string; person_id: string; status: string }[]
			};

	const confirmedBySession = new Map<string, number>();
	const waitlistBySession = new Map<string, number>();
	const myBySession = new Map<string, { id: string; status: string }>();

	for (const b of allBookings ?? []) {
		const sid = b.session_id as string;
		if (b.status === 'waitlisted') {
			waitlistBySession.set(sid, (waitlistBySession.get(sid) ?? 0) + 1);
		} else {
			confirmedBySession.set(sid, (confirmedBySession.get(sid) ?? 0) + 1);
		}
		if (b.person_id === member.personId) {
			myBySession.set(sid, { id: b.id as string, status: b.status as string });
		}
	}

	const sessions = (sessionRows ?? []).map((s) => {
		const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
		const mine = myBySession.get(s.id as string);
		return {
			id: s.id as string,
			className: (cls as { name?: string } | null)?.name ?? '',
			startsAt: s.starts_at as string,
			capacity: (s.capacity as number | null) ?? null,
			confirmedCount: confirmedBySession.get(s.id as string) ?? 0,
			waitlistCount: waitlistBySession.get(s.id as string) ?? 0,
			myStatus: mine?.status ?? null,
			myBookingId: mine?.id ?? null
		};
	});

	const { data: myBookingRows } = await supabase
		.from('class_bookings')
		.select(
			`
      id,
      status,
      class_sessions!inner (
        starts_at,
        gym_id,
        classes ( name )
      )
    `
		)
		.eq('person_id', member.personId)
		.eq('class_sessions.gym_id', member.activeGymId)
		.order('booked_at', { ascending: false })
		.limit(40);

	const bookings = (myBookingRows ?? []).map((b) => {
		const sessRaw = b.class_sessions as unknown;
		const sess = (
			Array.isArray(sessRaw) ? sessRaw[0] : sessRaw
		) as {
			starts_at: string;
			classes: { name: string } | { name: string }[] | null;
		} | null;
		const clsRaw = sess?.classes ?? null;
		const cls = (Array.isArray(clsRaw) ? clsRaw[0] : clsRaw) as { name: string } | null;
		const startsAt = sess?.starts_at ?? '';
		return {
			id: b.id as string,
			className: cls?.name ?? '',
			startsAt,
			status: b.status as string,
			upcoming: startsAt > now.toISOString() && b.status !== 'cancelled'
		};
	});

	return { locale, d, sessions, bookings };
};

export const actions = {
	book: async ({ request }) => bookSession(await request.formData()) as MemberActionState,
	cancel: async ({ request }) => cancelBooking(await request.formData()) as MemberActionState
} satisfies Actions;
