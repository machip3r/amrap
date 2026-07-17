import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaymentKind } from '$lib/types';
import { paymentKindFromDb } from '$lib/validation/db-enums';
import {
	buildPageMeta,
	ilikeContains,
	pageRange,
	sanitizeSearchTerm,
	TABLE_PAGE_SIZE,
	type PageMeta
} from '$lib/pagination';

const PAYMENT_LIST_SELECT = `
  id,
  amount,
  method,
  created_at,
  membership_id,
  kind,
  plan_id,
  plans ( name ),
  memberships (
    persons ( full_name )
  )
`;

function planNameFromJoin(
	plansJoin: { name: string } | { name: string }[] | null | undefined
) {
	if (!plansJoin) return null;
	if (Array.isArray(plansJoin)) return plansJoin[0]?.name ?? null;
	return plansJoin.name ?? null;
}

function memberNameFromJoin(
	memberships:
		| {
				persons: { full_name: string } | { full_name: string }[] | null;
		  }
		| {
				persons: { full_name: string } | { full_name: string }[] | null;
		  }[]
		| null
		| undefined
) {
	if (!memberships) return null;
	const m = Array.isArray(memberships) ? memberships[0] : memberships;
	if (!m?.persons) return null;
	const person = Array.isArray(m.persons) ? m.persons[0] : m.persons;
	return person?.full_name ?? null;
}

export type PaymentListRow = {
	id: string;
	amount: number;
	method: string;
	created_at: string;
	membership_id: string;
	member_name: string | null;
	kind: PaymentKind;
	plan_id: string | null;
	plan_name: string | null;
};

export async function listPaymentsPage(
	supabase: SupabaseClient,
	gymId: string,
	opts: { page?: number; pageSize?: number; q?: string } = {}
): Promise<{ payments: PaymentListRow[]; meta: PageMeta }> {
	const pageSize = opts.pageSize ?? TABLE_PAGE_SIZE;
	const page = opts.page ?? 1;
	const { from, to } = pageRange(page, pageSize);
	const q = sanitizeSearchTerm(opts.q ?? '');

	let membershipIds: string[] | null = null;
	if (q) {
		const pattern = ilikeContains(q);
		const { data: memberships, error: memErr } = await supabase
			.from('memberships')
			.select('id, persons!inner(full_name, email, phone)')
			.eq('gym_id', gymId)
			.or(
				`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`,
				{ foreignTable: 'persons' }
			)
			.limit(500);

		if (memErr) {
			console.error('listPaymentsPage memberships', memErr.message);
			return { payments: [], meta: buildPageMeta(page, 0, pageSize) };
		}

		membershipIds = (memberships ?? []).map((m) => m.id as string);
		if (membershipIds.length === 0) {
			return { payments: [], meta: buildPageMeta(page, 0, pageSize) };
		}
	}

	let query = supabase
		.from('payments')
		.select(PAYMENT_LIST_SELECT, { count: 'exact' })
		.eq('gym_id', gymId)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (membershipIds) query = query.in('membership_id', membershipIds);

	const { data, count, error } = await query;
	if (error) {
		console.error('listPaymentsPage', error.message);
		return { payments: [], meta: buildPageMeta(page, 0, pageSize) };
	}

	const payments: PaymentListRow[] = (data ?? []).map((p) => ({
		id: p.id as string,
		amount: Number(p.amount),
		method: p.method as string,
		created_at: p.created_at as string,
		membership_id: p.membership_id as string,
		member_name: memberNameFromJoin(
			p.memberships as Parameters<typeof memberNameFromJoin>[0]
		),
		kind: paymentKindFromDb(p.kind as string | null),
		plan_id: (p.plan_id as string | null) ?? null,
		plan_name: planNameFromJoin(
			p.plans as { name: string } | { name: string }[] | null
		)
	}));

	return {
		payments,
		meta: buildPageMeta(page, count ?? 0, pageSize)
	};
}
