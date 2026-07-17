import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, startOfWeekMonday, type ClassSessionRow } from '$lib/classes/types';

type WeekSessionRpcRow = {
	id: string;
	class_id: string;
	gym_id: string;
	schedule_id: string | null;
	starts_at: string;
	ends_at: string;
	capacity: number | null;
	status: ClassSessionRow['status'];
	class_name: string;
	confirmed_count: number;
	waitlist_count: number;
};

function mapRpcRows(data: WeekSessionRpcRow[]): ClassSessionRow[] {
	return data.map((r) => ({
		id: r.id,
		class_id: r.class_id,
		gym_id: r.gym_id,
		schedule_id: r.schedule_id ?? null,
		starts_at: r.starts_at,
		ends_at: r.ends_at,
		capacity: r.capacity ?? null,
		status: r.status,
		class_name: r.class_name ?? '',
		confirmed_count: r.confirmed_count ?? 0,
		waitlist_count: r.waitlist_count ?? 0
	}));
}

/** Fallback when the week RPC is unavailable or misbehaves. */
async function loadSessionsForWeekDirect(
	supabase: SupabaseClient,
	gymId: string,
	from: Date,
	to: Date,
	opts?: { classId?: string; trainerUserId?: string }
): Promise<ClassSessionRow[]> {
	let query = supabase
		.from('class_sessions')
		.select(
			`
      id,
      class_id,
      gym_id,
      schedule_id,
      starts_at,
      ends_at,
      capacity,
      status,
      classes ( name )
    `
		)
		.eq('gym_id', gymId)
		.gte('starts_at', from.toISOString())
		.lt('starts_at', to.toISOString())
		.order('starts_at', { ascending: true });

	if (opts?.classId) {
		query = query.eq('class_id', opts.classId);
	}

	const { data, error } = await query;
	if (error) {
		console.error('loadSessionsForWeekDirect', error.message);
		return [];
	}

	let rows = data ?? [];

	if (opts?.trainerUserId) {
		const { data: links } = await supabase
			.from('class_trainers')
			.select('class_id')
			.eq('user_id', opts.trainerUserId);
		const allowed = new Set((links ?? []).map((l) => l.class_id as string));
		rows = rows.filter((r) => allowed.has(r.class_id as string));
	}

	const sessionIds = rows.map((r) => r.id as string);
	const confirmedBySession = new Map<string, number>();
	const waitlistBySession = new Map<string, number>();

	if (sessionIds.length > 0) {
		const { data: bookings } = await supabase
			.from('class_bookings')
			.select('session_id, status')
			.in('session_id', sessionIds)
			.neq('status', 'cancelled');

		for (const b of bookings ?? []) {
			const sid = b.session_id as string;
			const st = b.status as string;
			if (st === 'waitlisted') {
				waitlistBySession.set(sid, (waitlistBySession.get(sid) ?? 0) + 1);
			} else {
				confirmedBySession.set(sid, (confirmedBySession.get(sid) ?? 0) + 1);
			}
		}
	}

	return rows.map((r) => {
		const cls = Array.isArray(r.classes) ? r.classes[0] : r.classes;
		return {
			id: r.id as string,
			class_id: r.class_id as string,
			gym_id: r.gym_id as string,
			schedule_id: (r.schedule_id as string | null) ?? null,
			starts_at: r.starts_at as string,
			ends_at: r.ends_at as string,
			capacity: (r.capacity as number | null) ?? null,
			status: r.status as ClassSessionRow['status'],
			class_name: (cls as { name?: string } | null)?.name ?? '',
			confirmed_count: confirmedBySession.get(r.id as string) ?? 0,
			waitlist_count: waitlistBySession.get(r.id as string) ?? 0
		};
	});
}

export async function loadSessionsForWeek(
	supabase: SupabaseClient,
	gymId: string,
	weekStart: Date,
	opts?: { classId?: string; trainerUserId?: string }
): Promise<ClassSessionRow[]> {
	const from = startOfWeekMonday(weekStart);
	const to = addDays(from, 7);

	const direct = await loadSessionsForWeekDirect(supabase, gymId, from, to, opts);
	if (direct.length > 0) return direct;

	const { data, error } = await supabase.rpc('list_class_sessions_for_week', {
		p_gym_id: gymId,
		p_from: from.toISOString(),
		p_to: to.toISOString(),
		p_trainer_user_id: opts?.trainerUserId ?? null,
		p_class_id: opts?.classId ?? null
	});

	if (error) {
		console.error('loadSessionsForWeek rpc', error.message);
		return direct;
	}

	return mapRpcRows((data ?? []) as WeekSessionRpcRow[]);
}

export type SessionResultKind = 'amrap' | 'strength' | 'for_time' | 'other';

export type SessionRosterResult = {
	id: string;
	kind: SessionResultKind;
	rounds: number | null;
	reps: number | null;
	weight_kg: number | null;
	time_seconds: number | null;
	note: string | null;
};

export type SessionRosterBooking = {
	id: string;
	session_id: string;
	person_id: string;
	membership_id: string;
	status: import('$lib/classes/types').ClassBookingStatus;
	waitlist_position: number | null;
	booked_at: string;
	person_name: string;
	date_of_birth: string | null;
	medical_note: string | null;
	isFirstDay: boolean;
	isBirthday: boolean;
	result: SessionRosterResult | null;
};

function isBirthdayToday(dateOfBirth: string | null, today: Date): boolean {
	if (!dateOfBirth) return false;
	const parts = dateOfBirth.slice(0, 10).split('-');
	if (parts.length !== 3) return false;
	const month = Number(parts[1]);
	const day = Number(parts[2]);
	if (!month || !day) return false;
	return today.getMonth() + 1 === month && today.getDate() === day;
}

export async function loadSessionRoster(supabase: SupabaseClient, sessionId: string) {
	const { data: session, error: sErr } = await supabase
		.from('class_sessions')
		.select(
			`
      id,
      class_id,
      gym_id,
      schedule_id,
      starts_at,
      ends_at,
      capacity,
      status,
      classes ( name )
    `
		)
		.eq('id', sessionId)
		.maybeSingle();

	if (sErr || !session) {
		console.error('loadSessionRoster session', sErr?.message);
		return null;
	}

	const gymId = session.gym_id as string;
	const startsAt = session.starts_at as string;

	const { data: bookings, error: bErr } = await supabase
		.from('class_bookings')
		.select(
			`
      id,
      session_id,
      person_id,
      membership_id,
      status,
      waitlist_position,
      booked_at,
      persons ( full_name, date_of_birth )
    `
		)
		.eq('session_id', sessionId)
		.neq('status', 'cancelled')
		.order('waitlist_position', { ascending: true, nullsFirst: false })
		.order('booked_at', { ascending: true });

	if (bErr) {
		console.error('loadSessionRoster bookings', bErr.message);
	}

	const bookingRows = bookings ?? [];
	const personIds = [...new Set(bookingRows.map((b) => b.person_id as string))];

	const careByPerson = new Map<string, string | null>();
	const resultByPerson = new Map<string, SessionRosterResult>();
	const priorAttendee = new Set<string>();
	const newMembershipIds = new Set<string>();
	let priorQueryOk = true;

	if (personIds.length > 0) {
		const [careRes, resultsRes, priorRes, membershipsRes] = await Promise.all([
			supabase
				.from('person_gym_care')
				.select('person_id, medical_note')
				.eq('gym_id', gymId)
				.in('person_id', personIds),
			supabase
				.from('class_session_results')
				.select('id, person_id, kind, rounds, reps, weight_kg, time_seconds, note')
				.eq('session_id', sessionId)
				.in('person_id', personIds),
			supabase
				.from('class_bookings')
				.select('person_id, class_sessions!inner ( gym_id, starts_at )')
				.in('person_id', personIds)
				.in('status', ['attended', 'confirmed'])
				.neq('session_id', sessionId)
				.eq('class_sessions.gym_id', gymId)
				.lt('class_sessions.starts_at', startsAt),
			supabase
				.from('memberships')
				.select('person_id, created_at')
				.eq('gym_id', gymId)
				.in('person_id', personIds)
		]);

		if (careRes.error) {
			console.error('loadSessionRoster care', careRes.error.message);
		}
		if (resultsRes.error) {
			console.error('loadSessionRoster results', resultsRes.error.message);
		}
		if (priorRes.error) {
			priorQueryOk = false;
			console.error('loadSessionRoster prior', priorRes.error.message);
		}

		for (const row of careRes.data ?? []) {
			careByPerson.set(row.person_id as string, (row.medical_note as string | null) ?? null);
		}

		for (const row of resultsRes.data ?? []) {
			resultByPerson.set(row.person_id as string, {
				id: row.id as string,
				kind: row.kind as SessionResultKind,
				rounds: (row.rounds as number | null) ?? null,
				reps: (row.reps as number | null) ?? null,
				weight_kg: row.weight_kg == null ? null : Number(row.weight_kg as number),
				time_seconds: (row.time_seconds as number | null) ?? null,
				note: (row.note as string | null) ?? null
			});
		}

		for (const row of priorRes.data ?? []) {
			priorAttendee.add(row.person_id as string);
		}

		const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		for (const row of membershipsRes.data ?? []) {
			if (new Date(row.created_at as string).getTime() >= sevenDaysAgo) {
				newMembershipIds.add(row.person_id as string);
			}
		}
	}

	const today = new Date();

	const cls = Array.isArray(session.classes) ? session.classes[0] : session.classes;

	return {
		session: {
			id: session.id as string,
			class_id: session.class_id as string,
			gym_id: gymId,
			schedule_id: (session.schedule_id as string | null) ?? null,
			starts_at: startsAt,
			ends_at: session.ends_at as string,
			capacity: (session.capacity as number | null) ?? null,
			status: session.status as ClassSessionRow['status'],
			class_name: (cls as { name?: string } | null)?.name ?? ''
		},
		bookings: bookingRows.map((b): SessionRosterBooking => {
			const person = Array.isArray(b.persons) ? b.persons[0] : b.persons;
			const p = person as {
				full_name?: string;
				date_of_birth?: string | null;
			} | null;
			const personId = b.person_id as string;
			const dob = p?.date_of_birth ?? null;
			const isFirstDay = priorQueryOk
				? !priorAttendee.has(personId)
				: newMembershipIds.has(personId);

			return {
				id: b.id as string,
				session_id: b.session_id as string,
				person_id: personId,
				membership_id: b.membership_id as string,
				status: b.status as import('$lib/classes/types').ClassBookingStatus,
				waitlist_position: (b.waitlist_position as number | null) ?? null,
				booked_at: b.booked_at as string,
				person_name: p?.full_name ?? '',
				date_of_birth: dob,
				medical_note: careByPerson.get(personId) ?? null,
				isFirstDay,
				isBirthday: isBirthdayToday(dob, today),
				result: resultByPerson.get(personId) ?? null
			};
		})
	};
}

export async function loadSchedulesForClass(supabase: SupabaseClient, classId: string) {
	const { data, error } = await supabase
		.from('class_schedules')
		.select(
			'id, class_id, gym_id, recurrence, days_of_week, local_time, timezone, valid_from, valid_until, capacity, duration_minutes, is_active'
		)
		.eq('class_id', classId)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('loadSchedulesForClass', error.message);
		return [];
	}

	return (data ?? []).map((s) => ({
		id: s.id as string,
		class_id: s.class_id as string,
		gym_id: s.gym_id as string,
		recurrence: s.recurrence as 'none' | 'weekly',
		days_of_week: (s.days_of_week as number[]) ?? [],
		local_time: String(s.local_time).slice(0, 5),
		timezone: s.timezone as string,
		valid_from: s.valid_from as string,
		valid_until: (s.valid_until as string | null) ?? null,
		capacity: (s.capacity as number | null) ?? null,
		duration_minutes: (s.duration_minutes as number | null) ?? null,
		is_active: Boolean(s.is_active)
	}));
}
