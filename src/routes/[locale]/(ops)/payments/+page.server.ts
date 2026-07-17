import { fail, redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import { getWorkspace } from '$lib/auth/session';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
import { listPaymentsPage } from '$lib/payments/queries';
import {
	listRecentPaymentMembers,
	searchPaymentMembers
} from '$lib/payments/member-options';
import { parsePage, sanitizeSearchTerm } from '$lib/pagination';
import { createPayment, type CreatePaymentState } from '$lib/server/payments/actions';
import { createClient } from '$lib/supabase/server';
import { formString } from '$lib/validation/schemas';
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

type PaymentStats = {
	monthTotal: number;
	monthCount: number;
	todayTotal: number;
	todayCount: number;
	plansTotal: number;
	plansCount: number;
	dayPassTotal: number;
	dayPassCount: number;
};

const emptyStats: PaymentStats = {
	monthTotal: 0,
	monthCount: 0,
	todayTotal: 0,
	todayCount: 0,
	plansTotal: 0,
	plansCount: 0,
	dayPassTotal: 0,
	dayPassCount: 0
};

export const load: PageServerLoad = async ({ parent, url, depends }) => {
	depends(OPS_LOAD_DEPS.payments);
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
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
			stats: emptyStats
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
		members,
		{ data: planRows },
		{ data: gymRow },
		{ payments, meta },
		statsRes
	] = await Promise.all([
		listRecentPaymentMembers(supabase, workspace.gymId),
		supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', workspace.gymId)
			.eq('is_active', true)
			.order('name', { ascending: true }),
		supabase.from('gyms').select('day_pass_price').eq('id', workspace.gymId).maybeSingle(),
		listPaymentsPage(supabase, workspace.gymId, { page, q }),
		supabase.rpc('gym_payment_stats', {
			p_gym_id: workspace.gymId,
			p_month_start: monthStartIso,
			p_today_start: todayStartIso
		})
	]);

	const plans = (planRows ?? []).map((p) => ({
		id: p.id,
		name: p.name,
		price: Number(p.price),
		duration_days: p.duration_days
	}));

	const dayPassPrice =
		gymRow?.day_pass_price != null ? Number(gymRow.day_pass_price) : null;

	let stats = emptyStats;
	if (statsRes.error) {
		console.error('gym_payment_stats', statsRes.error.message);
	} else {
		const row = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
		if (row) {
			stats = {
				monthTotal: Number(row.month_total) || 0,
				monthCount: Number(row.month_count) || 0,
				todayTotal: Number(row.today_total) || 0,
				todayCount: Number(row.today_count) || 0,
				plansTotal: Number(row.plans_total) || 0,
				plansCount: Number(row.plans_count) || 0,
				dayPassTotal: Number(row.day_pass_total) || 0,
				dayPassCount: Number(row.day_pass_count) || 0
			};
		}
	}

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
		stats,
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
	create: async ({ request }) => createPayment(await request.formData()) as CreatePaymentState,
	searchMembers: async ({ request }) => {
		const formData = await request.formData();
		const workspace = await getWorkspace();
		if (!workspace || !canInWorkspace(workspace, 'record_payment')) {
			return fail(403, { members: [] as Awaited<ReturnType<typeof searchPaymentMembers>> });
		}
		const q = sanitizeSearchTerm(formString(formData, 'q') ?? '');
		const supabase = createClient();
		const members = await searchPaymentMembers(supabase, workspace.gymId, q);
		return { members };
	}
} satisfies Actions;
