import { getRequestEvent } from '$app/server';
import { createClient } from '$lib/supabase/server';
import { getSessionUser } from '$lib/auth/session';

/** Cookie storing the member's preferred active gym (distinct from staff ACTIVE_GYM_COOKIE). */
export const MEMBER_GYM_COOKIE = 'amrap_member_gym_id';

type MemberGym = {
	gymId: string;
	gymName: string;
	membershipId: string;
	expiresAt: string;
};

export type MemberContext = {
	userId: string;
	personId: string;
	fullName: string | null;
	qrCode: string;
	gyms: MemberGym[];
	activeGymId: string;
};

type GymEmbed = { id: string; name: string };

type MembershipRow = {
	id: string;
	gym_id: string;
	expires_at: string;
	gyms: GymEmbed | GymEmbed[] | null;
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Resolves the signed-in user's member identity: linked `persons` row plus
 * active memberships (gyms they currently train at). Returns null when the
 * user has no linked person or no active membership anywhere.
 * Memoized on `event.locals` for the duration of one request.
 */
export async function getMemberContext(): Promise<MemberContext | null> {
	let locals: App.Locals | null = null;
	try {
		locals = getRequestEvent().locals;
	} catch {
		locals = null;
	}
	if (locals?.memberContextResolved) {
		return locals.memberContext ?? null;
	}

	const finish = (ctx: MemberContext | null) => {
		if (locals) {
			locals.memberContextResolved = true;
			locals.memberContext = ctx;
		}
		return ctx;
	};

	const supabase = createClient();
	const user = await getSessionUser();
	if (!user) return finish(null);

	const { data: person, error: personError } = await supabase
		.from('persons')
		.select('id, full_name, qr_code')
		.eq('user_id', user.id)
		.maybeSingle();

	if (personError) {
		console.error('getMemberContext person', personError.message);
	}
	if (!person) return finish(null);

	const nowIso = new Date().toISOString();
	const { data: memberships, error: membershipsError } = await supabase
		.from('memberships')
		.select('id, gym_id, expires_at, gyms ( id, name )')
		.eq('person_id', person.id)
		.eq('status', 'ACTIVE')
		.eq('invite_status', 'accepted')
		.gte('expires_at', nowIso)
		.order('expires_at', { ascending: false });

	if (membershipsError) {
		console.error('getMemberContext memberships', membershipsError.message);
	}

	const rows = (memberships ?? []) as unknown as MembershipRow[];
	const gyms = rows
		.map((row) => {
			const gym = firstEmbed(row.gyms);
			// Gym embed can be null if RLS on gyms is stale; still allow /me with gym_id.
			return {
				gymId: row.gym_id,
				gymName: gym?.name?.trim() || '—',
				membershipId: row.id,
				expiresAt: row.expires_at
			} satisfies MemberGym;
		})
		.filter((g) => Boolean(g.gymId));

	if (gyms.length === 0) return finish(null);

	const preferred = getRequestEvent().cookies.get(MEMBER_GYM_COOKIE);
	const active = (preferred && gyms.find((g) => g.gymId === preferred)) || gyms[0]!;

	return finish({
		userId: user.id,
		personId: person.id,
		fullName: person.full_name ?? null,
		qrCode: person.qr_code,
		gyms,
		activeGymId: active.gymId
	});
}
