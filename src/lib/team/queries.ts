import type { SupabaseClient } from '@supabase/supabase-js';
import type { InviteStatus, Role } from '$lib/types';
import { inviteStatusFromDb } from '$lib/validation/db-enums';
import {
	buildPageMeta,
	ilikeContains,
	pageRange,
	sanitizeSearchTerm,
	TABLE_PAGE_SIZE,
	type PageMeta
} from '$lib/pagination';

export type TeamMember = {
	id: string;
	userId: string;
	name: string;
	email: string | null;
	phone: string | null;
	role: Extract<Role, 'STAFF' | 'TRAINER'>;
	inviteStatus: InviteStatus;
	createdAt: string;
};

type RoleFilter = 'STAFF' | 'TRAINER';

type GymRoleListRow = {
	id: string;
	user_id: string;
	role: string;
	created_at: string;
	invite_status: string | null;
};

/**
 * Loads STAFF or TRAINER rows for a gym and enriches with persons profile.
 * Defaults to accepted seats only (class assignment, pickers).
 */
export async function loadTeamMembers(
	supabase: SupabaseClient,
	gymId: string,
	role: RoleFilter,
	opts: { inviteStatuses?: InviteStatus[] } = {}
): Promise<TeamMember[]> {
	const statuses = opts.inviteStatuses ?? ['ACCEPTED'];
	const { data: rows, error } = await supabase
		.from('gym_roles')
		.select('id, user_id, role, created_at, invite_status')
		.eq('gym_id', gymId)
		.eq('role', role)
		.in('invite_status', statuses)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('loadTeamMembers', error.message);
		return [];
	}

	return enrichTeamRows(supabase, rows ?? []);
}

export async function loadTeamMembersPage(
	supabase: SupabaseClient,
	gymId: string,
	role: RoleFilter,
	opts: { page?: number; pageSize?: number; q?: string } = {}
): Promise<{ members: TeamMember[]; meta: PageMeta }> {
	const pageSize = opts.pageSize ?? TABLE_PAGE_SIZE;
	const page = opts.page ?? 1;
	const { from, to } = pageRange(page, pageSize);
	const q = sanitizeSearchTerm(opts.q ?? '');

	let userIdsFilter: string[] | null = null;
	if (q) {
		const pattern = ilikeContains(q);
		const { data: people, error: peopleErr } = await supabase
			.from('persons')
			.select('user_id')
			.not('user_id', 'is', null)
			.or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
			.limit(500);

		if (peopleErr) {
			console.error('loadTeamMembersPage persons', peopleErr.message);
			return { members: [], meta: buildPageMeta(page, 0, pageSize) };
		}

		userIdsFilter = (people ?? [])
			.map((p) => p.user_id as string | null)
			.filter((id): id is string => Boolean(id));

		if (userIdsFilter.length === 0) {
			return { members: [], meta: buildPageMeta(page, 0, pageSize) };
		}
	}

	let query = supabase
		.from('gym_roles')
		.select('id, user_id, role, created_at, invite_status', { count: 'exact' })
		.eq('gym_id', gymId)
		.eq('role', role)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (userIdsFilter) query = query.in('user_id', userIdsFilter);

	const { data: rows, count, error } = await query;
	if (error) {
		console.error('loadTeamMembersPage', error.message);
		return { members: [], meta: buildPageMeta(page, 0, pageSize) };
	}

	const members = await enrichTeamRows(supabase, rows ?? []);
	return {
		members,
		meta: buildPageMeta(page, count ?? 0, pageSize)
	};
}

export async function loadTeamMemberById(
	supabase: SupabaseClient,
	gymId: string,
	roleId: string,
	role: RoleFilter
): Promise<TeamMember | null> {
	const { data: row, error } = await supabase
		.from('gym_roles')
		.select('id, user_id, role, created_at, invite_status')
		.eq('id', roleId)
		.eq('gym_id', gymId)
		.eq('role', role)
		.maybeSingle();

	if (error) {
		console.error('loadTeamMemberById', error.message);
		return null;
	}
	if (!row) return null;
	const list = await enrichTeamRows(supabase, [row]);
	return list[0] ?? null;
}

async function enrichTeamRows(
	supabase: SupabaseClient,
	list: GymRoleListRow[]
): Promise<TeamMember[]> {
	if (list.length === 0) return [];

	const userIds = list.map((r) => r.user_id);
	const { data: people, error: peopleErr } = await supabase
		.from('persons')
		.select('user_id, full_name, email, phone')
		.in('user_id', userIds);

	if (peopleErr) {
		console.error('enrichTeamRows persons', peopleErr.message);
	}

	const byUser = new Map(
		(people ?? []).filter((p) => p.user_id).map((p) => [p.user_id as string, p] as const)
	);

	return list
		.filter((r) => r.role === 'STAFF' || r.role === 'TRAINER')
		.map((r) => {
			const person = byUser.get(r.user_id);
			return {
				id: r.id,
				userId: r.user_id,
				name: person?.full_name?.trim() || '—',
				email: person?.email ?? null,
				phone: person?.phone ?? null,
				role: r.role as RoleFilter,
				inviteStatus: inviteStatusFromDb(r.invite_status),
				createdAt: r.created_at
			};
		});
}

export async function countStaffAndTrainers(
	supabase: SupabaseClient,
	gymId: string
): Promise<number> {
	const { count, error } = await supabase
		.from('gym_roles')
		.select('id', { count: 'exact', head: true })
		.eq('gym_id', gymId)
		.in('role', ['STAFF', 'TRAINER'])
		.in('invite_status', ['PENDING', 'ACCEPTED']);

	if (error) {
		console.error('countStaffAndTrainers', error.message);
		return 0;
	}
	return count ?? 0;
}
