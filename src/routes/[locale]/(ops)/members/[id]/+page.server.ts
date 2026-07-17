import { error, redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { MEMBERSHIP_LIST_SELECT, mapMembershipRow } from '$lib/members/queries';
import {
	deleteMemberAction,
	renewMember,
	savePersonCareNote
} from '$lib/server/members/actions';
import { createClient } from '$lib/supabase/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { locale } = await parent();
	const workspace = await getWorkspace();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const d = getDictionary(locale as Locale);

	if (!canInWorkspace(workspace, 'manage_members')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			member: null,
			plans: [],
			careNote: null
		};
	}

	const supabase = createClient();
	const { data: row } = await supabase
		.from('memberships')
		.select(MEMBERSHIP_LIST_SELECT)
		.eq('id', params.id)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();

	const member = row
		? mapMembershipRow(row as Parameters<typeof mapMembershipRow>[0])
		: null;
	if (!member) error(404, d.members.notFound);

	const [{ data: plans }, { data: care }] = await Promise.all([
		supabase
			.from('plans')
			.select('id, name, price, duration_days')
			.eq('gym_id', workspace.gymId)
			.eq('is_active', true)
			.order('created_at', { ascending: false }),
		supabase
			.from('person_gym_care')
			.select('medical_note')
			.eq('gym_id', workspace.gymId)
			.eq('person_id', member.person_id)
			.maybeSingle()
	]);

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		member,
		plans: (plans ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			price: Number(p.price),
			duration_days: p.duration_days
		})),
		careNote: care?.medical_note ?? null
	};
};

export const actions = {
	renew: async ({ request }) => {
		await renewMember(await request.formData());
	},
	delete: async ({ request }) => {
		await deleteMemberAction(await request.formData());
	},
	saveCare: async ({ request }) => savePersonCareNote(await request.formData())
} satisfies Actions;
