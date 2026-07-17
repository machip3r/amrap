import type { SupabaseClient } from '@supabase/supabase-js';
import {
	MEMBERSHIP_LIST_SELECT,
	mapMembershipRow
} from '$lib/members/queries';
import { ilikeContains, sanitizeSearchTerm } from '$lib/pagination';

export type PaymentMemberOption = {
	id: string;
	name: string;
	email: string | null;
};

const RECENT_MEMBER_LIMIT = 40;
const SEARCH_MEMBER_LIMIT = 20;

function toOptions(
	rows: Parameters<typeof mapMembershipRow>[0][]
): PaymentMemberOption[] {
	return rows
		.map((r) => mapMembershipRow(r))
		.filter((m): m is NonNullable<typeof m> => m != null)
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((m) => ({
			id: m.id,
			name: m.name,
			email: m.email
		}));
}

/** Recent memberships for payment dialog seed (bounded). */
export async function listRecentPaymentMembers(
	supabase: SupabaseClient,
	gymId: string
): Promise<PaymentMemberOption[]> {
	const { data, error } = await supabase
		.from('memberships')
		.select(MEMBERSHIP_LIST_SELECT)
		.eq('gym_id', gymId)
		.order('created_at', { ascending: false })
		.limit(RECENT_MEMBER_LIMIT);

	if (error) {
		console.error('listRecentPaymentMembers', error.message);
		return [];
	}

	return toOptions((data ?? []) as Parameters<typeof mapMembershipRow>[0][]);
}

/** Search memberships by person name/email for payment dialog. */
export async function searchPaymentMembers(
	supabase: SupabaseClient,
	gymId: string,
	rawQuery: string
): Promise<PaymentMemberOption[]> {
	const q = sanitizeSearchTerm(rawQuery, 120);
	if (!q) return listRecentPaymentMembers(supabase, gymId);

	const pattern = ilikeContains(q);
	const { data, error } = await supabase
		.from('memberships')
		.select(MEMBERSHIP_LIST_SELECT)
		.eq('gym_id', gymId)
		.or(`full_name.ilike.${pattern},email.ilike.${pattern}`, {
			foreignTable: 'persons'
		})
		.order('created_at', { ascending: false })
		.limit(SEARCH_MEMBER_LIMIT);

	if (error) {
		console.error('searchPaymentMembers', error.message);
		return [];
	}

	return toOptions((data ?? []) as Parameters<typeof mapMembershipRow>[0][]);
}
