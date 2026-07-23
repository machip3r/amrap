import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { getMemberContext, MEMBER_GYM_COOKIE } from '$lib/auth/member-session';
import { ACTIVE_GYM_COOKIE, getSessionUser } from '$lib/auth/session';
import { createClient } from '$lib/supabase/server';
import type { Role } from '$lib/types';

/** Active identity: `ops:<gymId>` or `member:<gymId>`. */
export const CONTEXT_COOKIE = 'amrap_context';

/** @deprecated Prefer CONTEXT_COOKIE; still read for migration. */
export const SHELL_COOKIE = 'amrap_shell';

export type IdentityKind = 'ops' | 'member';

export type UserIdentity = {
	/** Stable id: `ops:<gymId>` or `member:<gymId>`. */
	id: string;
	kind: IdentityKind;
	gymId: string;
	gymName: string;
	/** Ops role, or MEMBER for training context. */
	role: Role | 'MEMBER';
	isProvisionalOwner: boolean;
};

const COOKIE_OPTS = {
	path: '/',
	sameSite: 'lax' as const,
	httpOnly: true,
	secure: !dev,
	maxAge: 60 * 60 * 24 * 365
};

export function identityId(kind: IdentityKind, gymId: string): string {
	return `${kind}:${gymId}`;
}

export function parseContextValue(raw: string | undefined | null): {
	kind: IdentityKind;
	gymId: string;
} | null {
	if (!raw) return null;
	const match = /^(ops|member):([0-9a-f-]{36})$/i.exec(raw.trim());
	if (!match) return null;
	return { kind: match[1] as IdentityKind, gymId: match[2]! };
}

export function getStoredContext(): { kind: IdentityKind; gymId: string } | null {
	try {
		const cookies = getRequestEvent().cookies;
		const fromContext = parseContextValue(cookies.get(CONTEXT_COOKIE));
		if (fromContext) return fromContext;

		// Migrate legacy shell preference + gym cookies.
		const shell = cookies.get(SHELL_COOKIE);
		if (shell === 'ops') {
			const gymId = cookies.get(ACTIVE_GYM_COOKIE);
			if (gymId) return { kind: 'ops', gymId };
		}
		if (shell === 'member') {
			const gymId = cookies.get(MEMBER_GYM_COOKIE);
			if (gymId) return { kind: 'member', gymId };
		}
	} catch {
		/* outside request */
	}
	return null;
}

/** Persist active identity and keep gym cookies in sync for existing loaders. */
export function activateIdentity(kind: IdentityKind, gymId: string): void {
	const cookies = getRequestEvent().cookies;
	cookies.set(CONTEXT_COOKIE, identityId(kind, gymId), COOKIE_OPTS);
	if (kind === 'ops') {
		cookies.set(ACTIVE_GYM_COOKIE, gymId, COOKIE_OPTS);
	} else {
		cookies.set(MEMBER_GYM_COOKIE, gymId, COOKIE_OPTS);
	}
	// Drop legacy shell cookie once context is set.
	cookies.delete(SHELL_COOKIE, { path: '/' });
}

type RoleRow = {
	gym_id: string;
	role: Role;
	is_provisional_owner: boolean;
	gyms: { id: string; name: string } | { id: string; name: string }[] | null;
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * All usable identities for the signed-in user (ops roles + active memberships).
 * Memoized on `event.locals` for the request.
 */
export async function listUserIdentities(): Promise<UserIdentity[]> {
	let locals: App.Locals | null = null;
	try {
		locals = getRequestEvent().locals;
	} catch {
		locals = null;
	}
	if (locals?.identitiesResolved) {
		return locals.identities ?? [];
	}

	const finish = (list: UserIdentity[]) => {
		if (locals) {
			locals.identitiesResolved = true;
			locals.identities = list;
		}
		return list;
	};

	const user = await getSessionUser();
	if (!user) return finish([]);

	const supabase = createClient();
	const [rolesResult, member] = await Promise.all([
		supabase
			.from('gym_roles')
			.select(
				`
				gym_id,
				role,
				is_provisional_owner,
				invite_status,
				gyms ( id, name )
			`
			)
			.eq('user_id', user.id)
			.or('invite_status.eq.accepted,role.eq.OWNER'),
		getMemberContext()
	]);

	const out: UserIdentity[] = [];

	if (!rolesResult.error && rolesResult.data?.length) {
		for (const row of rolesResult.data as unknown as RoleRow[]) {
			const gym = firstEmbed(row.gyms);
			const gymId = row.gym_id || gym?.id;
			if (!gymId) continue;
			out.push({
				id: identityId('ops', gymId),
				kind: 'ops',
				gymId,
				gymName: gym?.name?.trim() || '—',
				role: row.role,
				isProvisionalOwner: Boolean(row.is_provisional_owner)
			});
		}
	}

	if (member) {
		for (const g of member.gyms) {
			out.push({
				id: identityId('member', g.gymId),
				kind: 'member',
				gymId: g.gymId,
				gymName: g.gymName,
				role: 'MEMBER',
				isProvisionalOwner: false
			});
		}
	}

	// Stable order: gym name, then ops before member at same gym.
	out.sort((a, b) => {
		const byGym = a.gymName.localeCompare(b.gymName, undefined, { sensitivity: 'base' });
		if (byGym !== 0) return byGym;
		if (a.kind === b.kind) return 0;
		return a.kind === 'ops' ? -1 : 1;
	});

	return finish(out);
}

/** Pick stored context if still valid; else first ops, else first member. */
export function pickActiveIdentity(identities: UserIdentity[]): UserIdentity | null {
	if (identities.length === 0) return null;
	const stored = getStoredContext();
	if (stored) {
		const match = identities.find((i) => i.kind === stored.kind && i.gymId === stored.gymId);
		if (match) return match;
	}
	return identities.find((i) => i.kind === 'ops') ?? identities[0] ?? null;
}

export async function resolveActiveIdentity(): Promise<UserIdentity | null> {
	const identities = await listUserIdentities();
	return pickActiveIdentity(identities);
}
