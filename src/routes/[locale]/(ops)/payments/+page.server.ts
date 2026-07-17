import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import {
	MEMBERSHIP_LIST_SELECT,
	mapMembershipRow
} from '$lib/members/queries';
import { listPaymentsPage } from '$lib/payments/queries';
import { parsePage, sanitizeSearchTerm } from '$lib/pagination';
import { createPayment, type CreatePaymentState } from '$lib/server/payments/actions';
import { createClient } from '$lib/supabase/server';
import { paymentKindFromDb, paymentMethodFromDb } from '$lib/validation/db-enums';
import type { Actions, PageServerLoad } from './$types';

function startOfLocalDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function startOfLocalMonth(d: Date) {
	const x = startOfLocalDay(d);
	x.setDate(1);
	return x;
}

function sumAmounts(
	rows: { amount: number | string; kind?: string | null; created_at: string }[],
	predicate?: (row: {
		amount: number | string;
		kind?: string | null;
		created_at: string;
	}) => boolean
) {
	let total = 0;
	let count = 0;
	for (const row of rows) {
		if (predicate && !predicate(row)) continue;
		total += Number(row.amount);
		count += 1;
	}
	return { total, count };
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, d } = await parent();
	const workspace = await getWorkspace();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (!canInWorkspace(workspace, 'record_payment')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			members: [],
			plans: [],
			dayPassPrice: null as number | null,
			payments: [],
			meta: { page: 1, pageSize: 25, total: 0, totalPages: 1, from: 0, to: 0 },
			q: '',
			listError: false,
			stats: {
				monthTotal: 0,
				monthCount: 0,
				todayTotal: 0,
				todayCount: 0,
				plansTotal: 0,
				plansCount: 0,
				dayPassTotal: 0,
				dayPassCount: 0
			}
		};
	}

	const page = parsePage(url.searchParams.get('page'));
	const q = sanitizeSearchTerm(url.searchParams.get('q') ?? '');
	const listError = url.searchParams.get('error') === '1';

	const now = new Date();
	const monthStartIso = startOfLocalMonth(now).toISOString();
	const todayStartIso = startOfLocalDay(now).toISOString();

	const supabase = createClient();
	const [
		{ data: membershipRows },
		{ data: planRows },
		{ data: gymRow },
		{ payments, meta },
		{ data: monthPaymentRows }
	] = await Promise.all([
		supabase
			.from('memberships')
			.select(MEMBERSHIP_LIST_SELECT)
			.eq('gym_id', workspace.gymId)
			.order('created_at', { ascending: false }),
		supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', workspace.gymId)
			.eq('is_active', true)
			.order('name', { ascending: true }),
		supabase.from('gyms').select('day_pass_price').eq('id', workspace.gymId).maybeSingle(),
		listPaymentsPage(supabase, workspace.gymId, { page, q }),
		supabase
			.from('payments')
			.select('amount, kind, created_at')
			.eq('gym_id', workspace.gymId)
			.gte('created_at', monthStartIso)
			.order('created_at', { ascending: false })
	]);

	const members = (membershipRows ?? [])
		.map((r) => mapMembershipRow(r as Parameters<typeof mapMembershipRow>[0]))
		.filter((m): m is NonNullable<typeof m> => m != null)
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((m) => ({
			id: m.id,
			name: m.name,
			email: m.email
		}));

	const plans = (planRows ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		price: Number(p.price),
		duration_days: p.duration_days
	}));

	const dayPassPrice =
		gymRow?.day_pass_price != null ? Number(gymRow.day_pass_price) : null;

	const monthRows = monthPaymentRows ?? [];
	const month = sumAmounts(monthRows);
	const today = sumAmounts(monthRows, (row) => row.created_at >= todayStartIso);
	const plansMonth = sumAmounts(
		monthRows,
		(row) => paymentKindFromDb(row.kind) === 'plan'
	);
	const dayPassMonth = sumAmounts(
		monthRows,
		(row) => paymentKindFromDb(row.kind) === 'day_pass'
	);

	function methodLabel(rawMethod: string) {
		const m = paymentMethodFromDb(rawMethod);
		if (m === 'cash') return d.payments.cash;
		if (m === 'transfer') return d.payments.transfer;
		return rawMethod;
	}

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		members,
		plans,
		dayPassPrice,
		meta,
		q,
		listError,
		stats: {
			monthTotal: month.total,
			monthCount: month.count,
			todayTotal: today.total,
			todayCount: today.count,
			plansTotal: plansMonth.total,
			plansCount: plansMonth.count,
			dayPassTotal: dayPassMonth.total,
			dayPassCount: dayPassMonth.count
		},
		payments: payments.map((p) => {
			const kind = p.kind;
			return {
				id: p.id,
				memberName: p.member_name ?? p.membership_id,
				amount: p.amount,
				methodLabel: methodLabel(p.method),
				createdAt: p.created_at,
				kind,
				kindLabel: kind === 'day_pass' ? d.payments.kindDayPass : d.payments.kindPlan,
				planName: kind === 'plan' ? p.plan_name : null
			};
		})
	};
};

export const actions = {
	create: async ({ request }) => createPayment(await request.formData()) as CreatePaymentState
} satisfies Actions;
