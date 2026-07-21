import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { createClient } from '$lib/supabase/server';
import { checkInCodeSchema, uuidSchema } from '$lib/validation/schemas';
import { ilikeContains, sanitizeSearchTerm } from '$lib/pagination';

export type CheckinMember = {
	name: string;
	planName: string | null;
	expiresAt: string;
	weekCheckIns: number;
	personId: string;
	classBooking?: {
		className: string;
		startsAt: string;
		status: string;
	} | null;
	openSessions?: OpenClassSession[];
};

type OpenClassSession = {
	sessionId: string;
	classId: string;
	className: string;
	startsAt: string;
	endsAt: string;
	capacity: number | null;
	confirmedCount: number;
	hasBooking: boolean;
	bookingStatus: string | null;
};

export type CheckinResult =
	| { status: 'ok'; member: CheckinMember | null }
	| { status: 'denied' }
	| { status: 'not_found' }
	| { status: 'forbidden' }
	| { status: 'empty' }
	| { status: 'busy' }
	| { status: 'error' };

export type CheckinCandidate = {
	membershipId: string;
	name: string;
	email: string | null;
	phone: string | null;
	planName: string | null;
	expiresAt: string;
	active: boolean;
};

export type SearchCheckInResult =
	| { status: 'matches'; matches: CheckinCandidate[] }
	| { status: 'not_found' }
	| { status: 'forbidden' }
	| { status: 'empty' }
	| { status: 'error' };

type PersonEmbed = { full_name: string } | { full_name: string }[] | null;
type PlanEmbed = { name: string } | { name: string }[] | null;
type MembershipEmbed =
	| { expires_at: string; person_id: string; plans: PlanEmbed }
	| { expires_at: string; person_id: string; plans: PlanEmbed }[]
	| null;

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

type Supabase = ReturnType<typeof createClient>;

async function loadOpenSessions(
	supabase: Supabase,
	gymId: string,
	personId: string
): Promise<OpenClassSession[]> {
	const { data, error } = await supabase.rpc('list_open_class_sessions_for_check_in', {
		p_gym_id: gymId,
		p_person_id: personId
	});
	if (error) {
		console.error('list_open_class_sessions_for_check_in', error.message);
		return [];
	}
	return (data ?? []).map(
		(row: {
			session_id: string;
			class_id: string;
			class_name: string;
			starts_at: string;
			ends_at: string;
			capacity: number | null;
			confirmed_count: number;
			has_booking: boolean;
			booking_status: string | null;
		}) => ({
			sessionId: row.session_id,
			classId: row.class_id,
			className: row.class_name,
			startsAt: row.starts_at,
			endsAt: row.ends_at,
			capacity: row.capacity,
			confirmedCount: row.confirmed_count,
			hasBooking: row.has_booking,
			bookingStatus: row.booking_status
		})
	);
}

async function loadMemberFromCheckIn(
	supabase: Supabase,
	checkInId: string,
	gymId: string
): Promise<CheckinMember | null> {
	const { data } = await supabase
		.from('check_ins')
		.select(
			`
      person_id,
      persons ( full_name ),
      memberships (
        expires_at,
        person_id,
        plans ( name )
      )
    `
		)
		.eq('id', checkInId)
		.eq('gym_id', gymId)
		.maybeSingle();

	if (!data) return null;

	const person = firstEmbed(data.persons as PersonEmbed);
	const membership = firstEmbed(data.memberships as MembershipEmbed);
	const plan = firstEmbed(membership?.plans ?? null);
	const personId = (data.person_id as string) || membership?.person_id;
	if (!person?.full_name || !membership?.expires_at || !personId) return null;

	let weekCheckIns = 0;
	const weekStart = new Date();
	weekStart.setHours(0, 0, 0, 0);
	const day = weekStart.getDay();
	weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
	const { count } = await supabase
		.from('check_ins')
		.select('id', { count: 'exact', head: true })
		.eq('gym_id', gymId)
		.eq('person_id', personId)
		.gte('checked_in_at', weekStart.toISOString());
	weekCheckIns = count ?? 0;

	const { data: attended } = await supabase
		.from('class_bookings')
		.select(
			`
      status,
      class_sessions!inner (
        starts_at,
        gym_id,
        classes ( name )
      )
    `
		)
		.eq('person_id', personId)
		.eq('status', 'attended')
		.gte('class_sessions.starts_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
		.order('booked_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	let classBooking: CheckinMember['classBooking'] = null;
	if (attended) {
		const sessRaw = attended.class_sessions as unknown;
		const sess = (Array.isArray(sessRaw) ? sessRaw[0] : sessRaw) as {
			starts_at: string;
			gym_id: string;
			classes: { name: string } | { name: string }[] | null;
		} | null;
		const clsRaw = sess?.classes ?? null;
		const cls = (Array.isArray(clsRaw) ? clsRaw[0] : clsRaw) as { name: string } | null;
		if (sess && sess.gym_id === gymId) {
			classBooking = {
				className: cls?.name ?? '',
				startsAt: sess.starts_at,
				status: attended.status as string
			};
		}
	}

	const openSessions = await loadOpenSessions(supabase, gymId, personId);

	return {
		name: person.full_name,
		planName: plan?.name ?? null,
		expiresAt: membership.expires_at,
		weekCheckIns,
		personId,
		classBooking,
		openSessions
	};
}

async function searchMembershipCandidates(
	supabase: Supabase,
	gymId: string,
	raw: string
): Promise<CheckinCandidate[]> {
	const trimmed = raw.trim();
	if (!trimmed) return [];

	const asUuid = uuidSchema.safeParse(trimmed);
	if (asUuid.success) {
		const { data, error } = await supabase
			.from('memberships')
			.select(
				`
        id,
        expires_at,
        plans ( name ),
        persons ( full_name, email, phone )
      `
			)
			.eq('gym_id', gymId)
			.eq('id', asUuid.data)
			.limit(1);

		if (error) {
			console.error('searchMembershipCandidates id', error.message);
			return [];
		}
		return mapCandidateRows(data ?? []);
	}

	const q = sanitizeSearchTerm(trimmed, 120);
	if (!q) {
		const { data, error } = await supabase
			.from('memberships')
			.select(
				`
        id,
        expires_at,
        plans ( name ),
        persons!inner ( full_name, email, phone, qr_code )
      `
			)
			.eq('gym_id', gymId)
			.eq('persons.qr_code', trimmed)
			.limit(20);

		if (error) {
			console.error('searchMembershipCandidates qr', error.message);
			return [];
		}
		return mapCandidateRows(data ?? []);
	}

	const pattern = ilikeContains(q);
	const { data, error } = await supabase
		.from('memberships')
		.select(
			`
      id,
      expires_at,
      plans ( name ),
      persons!inner ( full_name, email, phone, qr_code )
    `
		)
		.eq('gym_id', gymId)
		.or(
			`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},qr_code.eq.${trimmed}`,
			{ foreignTable: 'persons' }
		)
		.order('expires_at', { ascending: false })
		.limit(20);

	if (error) {
		console.error('searchMembershipCandidates', error.message);
		return [];
	}
	return mapCandidateRows(data ?? []);
}

function mapCandidateRows(
	rows: {
		id: string;
		expires_at: string;
		plans: PlanEmbed;
		persons:
			| {
					full_name: string;
					email: string | null;
					phone: string | null;
			  }
			| {
					full_name: string;
					email: string | null;
					phone: string | null;
			  }[]
			| null;
	}[]
): CheckinCandidate[] {
	const now = Date.now();
	const out: CheckinCandidate[] = [];
	for (const row of rows) {
		const person = firstEmbed(row.persons);
		if (!person?.full_name) continue;
		const plan = firstEmbed(row.plans);
		out.push({
			membershipId: row.id,
			name: person.full_name,
			email: person.email ?? null,
			phone: person.phone ?? null,
			planName: plan?.name ?? null,
			expiresAt: row.expires_at,
			active: new Date(row.expires_at).getTime() > now
		});
	}
	return out;
}

/** Manual desk search — returns matches for the staff to pick before check-in. */
export async function searchCheckInCandidates(raw: string): Promise<SearchCheckInResult> {
	const parsed = checkInCodeSchema.safeParse(raw);
	if (!parsed.success) return { status: 'empty' };

	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'checkin')) {
		return { status: 'forbidden' };
	}

	const supabase = createClient();
	const matches = await searchMembershipCandidates(supabase, workspace.gymId, parsed.data);
	if (matches.length === 0) return { status: 'not_found' };
	return { status: 'matches', matches };
}

/** Confirm check-in for a membership chosen from search results. */
export async function confirmCheckIn(membershipId: string): Promise<CheckinResult> {
	const id = uuidSchema.safeParse(membershipId);
	if (!id.success) return { status: 'empty' };

	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'checkin')) {
		return { status: 'forbidden' };
	}

	const supabase = createClient();
	const byMembership = await supabase.rpc('record_check_in', {
		p_gym_id: workspace.gymId,
		p_qr_code: null,
		p_membership_id: id.data,
		p_branch_id: null,
		p_source: 'MANUAL'
	});

	if (!byMembership.error && byMembership.data) {
		const member = await loadMemberFromCheckIn(
			supabase,
			byMembership.data as string,
			workspace.gymId
		);
		return { status: 'ok', member };
	}

	return mapCheckInError(byMembership.error?.message ?? 'error');
}

/** QR / direct code check-in (camera or exact QR token). */
export async function runCheckIn(raw: string): Promise<CheckinResult> {
	const parsed = checkInCodeSchema.safeParse(raw);
	if (!parsed.success) return { status: 'empty' };
	const trimmed = parsed.data;

	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'checkin')) {
		return { status: 'forbidden' };
	}

	const supabase = createClient();

	const byQr = await supabase.rpc('record_check_in', {
		p_gym_id: workspace.gymId,
		p_qr_code: trimmed,
		p_membership_id: null,
		p_branch_id: null,
		p_source: 'QR'
	});

	if (!byQr.error && byQr.data) {
		const member = await loadMemberFromCheckIn(supabase, byQr.data as string, workspace.gymId);
		return { status: 'ok', member };
	}

	const asUuid = uuidSchema.safeParse(trimmed);
	if (asUuid.success) {
		const byMembership = await supabase.rpc('record_check_in', {
			p_gym_id: workspace.gymId,
			p_qr_code: null,
			p_membership_id: asUuid.data,
			p_branch_id: null,
			p_source: 'MANUAL'
		});

		if (!byMembership.error && byMembership.data) {
			const member = await loadMemberFromCheckIn(
				supabase,
				byMembership.data as string,
				workspace.gymId
			);
			return { status: 'ok', member };
		}

		return mapCheckInError(byMembership.error?.message ?? byQr.error?.message ?? 'error');
	}

	return mapCheckInError(byQr.error?.message ?? 'Membership not found');
}

export async function walkInEnroll(
	sessionId: string,
	personId: string
): Promise<{ ok: boolean; error?: string }> {
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'checkin')) {
		return { ok: false, error: 'forbidden' };
	}
	const s = uuidSchema.safeParse(sessionId);
	const p = uuidSchema.safeParse(personId);
	if (!s.success || !p.success) return { ok: false, error: 'invalid' };

	const supabase = createClient();
	const { error } = await supabase.rpc('walk_in_enroll_class_session', {
		p_session_id: s.data,
		p_person_id: p.data
	});
	if (error) {
		console.error('walkInEnroll', error.message);
		return { ok: false, error: error.message };
	}
	return { ok: true };
}

function mapCheckInError(message: string): CheckinResult {
	const m = message.toLowerCase();
	if (m.includes('not found') || m.includes('invalid input syntax')) {
		return { status: 'not_found' };
	}
	if (m.includes('inactive') || m.includes('expired')) return { status: 'denied' };
	if (m.includes('already in use') || m.includes('another gym')) {
		return { status: 'busy' };
	}
	if (m.includes('not allowed')) return { status: 'forbidden' };
	console.error('runCheckIn', message);
	return { status: 'error' };
}
