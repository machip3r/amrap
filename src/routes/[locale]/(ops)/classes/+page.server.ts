import { redirect } from '@sveltejs/kit';
import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { loadSessionsForWeek } from '$lib/classes/queries';
import { startOfWeekMonday } from '$lib/classes/types';
import type { Locale } from '$lib/i18n/config';
import {
	createClass,
	createClassSchedule,
	duplicateClassToGym,
	setClassActive,
	updateClass,
	type ClassFormState,
	type ScheduleFormState
} from '$lib/server/classes/actions';
import { createClient } from '$lib/supabase/server';
import { loadTeamMembers } from '$lib/team/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, url }) => {
	const { locale, d } = await parent();
	const workspace = await getWorkspace();
	if (!workspace) throw redirect(303, `/${locale}/login`);

	const canManage = canInWorkspace(workspace, 'manage_classes');
	const canView = canManage || canInWorkspace(workspace, 'checkin');
	if (!canView) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d,
			classes: [],
			trainers: [],
			sessions: [],
			weekStartIso: '',
			orgGyms: [],
			currentGymId: '',
			canManage: false,
			currentUserId: '',
			lockTrainersToSelf: false,
			defaultTrainerIds: undefined as string[] | undefined,
			initialView: 'calendar' as const
		};
	}

	const lockTrainersToSelf = workspace.role === 'TRAINER' && !workspace.canActAsOwner;
	const tab = url.searchParams.get('tab');
	const initialView =
		tab === 'calendar' || tab === 'catalog' ? tab : canManage ? 'catalog' : 'calendar';

	const weekRaw = url.searchParams.get('week');
	const weekStart = weekRaw
		? startOfWeekMonday(new Date(`${weekRaw}T12:00:00`))
		: startOfWeekMonday(new Date());

	const supabase = createClient();
	const loadCatalog = initialView === 'catalog';
	const loadTrainers = loadCatalog || canManage;
	const loadSiblingGyms = loadCatalog && canManage && !lockTrainersToSelf;

	const [classResult, trainers, sessions, orgGymRows] = await Promise.all([
		loadCatalog
			? supabase
					.from('classes')
					.select(
						'id, name, description, capacity, duration_minutes, tags, is_active, created_at, class_trainers(user_id)'
					)
					.eq('gym_id', workspace.gymId)
					.order('is_active', { ascending: false })
					.order('created_at', { ascending: false })
			: Promise.resolve({ data: [] as never[], error: null }),
		loadTrainers ? loadTeamMembers(supabase, workspace.gymId, 'TRAINER') : Promise.resolve([]),
		loadSessionsForWeek(supabase, workspace.gymId, weekStart),
		loadSiblingGyms
			? supabase
					.from('gyms')
					.select('id, name')
					.eq('organization_id', workspace.organizationId)
					.is('deleted_at', null)
					.order('name')
					.then((r) => r.data ?? [])
			: Promise.resolve([] as { id: string; name: string }[])
	]);

	if (classResult.error) {
		console.error('classes page', classResult.error.message);
	}

	const trainerNameByUserId = new Map(trainers.map((t) => [t.userId, t.name] as const));

	const classes = (classResult.data ?? []).map((row) => {
		const links = Array.isArray(row.class_trainers)
			? row.class_trainers
			: row.class_trainers
				? [row.class_trainers]
				: [];
		const trainerIds = links
			.map((l) => (l as { user_id: string }).user_id)
			.filter(Boolean);
		return {
			id: row.id as string,
			name: row.name as string,
			description: (row.description as string | null) ?? null,
			capacity: (row.capacity as number | null) ?? null,
			duration_minutes: (row.duration_minutes as number) ?? 60,
			tags: (row.tags as string[]) ?? [],
			is_active: Boolean(row.is_active),
			trainerIds,
			trainerNames: trainerIds.map((id) => trainerNameByUserId.get(id) ?? id.slice(0, 8))
		};
	});

	const weekStartIso = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}T12:00:00`;

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		classes,
		trainers: trainers.map((t) => ({ userId: t.userId, name: t.name })),
		sessions,
		weekStartIso,
		orgGyms: orgGymRows.map((g) => ({ id: g.id, name: g.name })),
		currentGymId: workspace.gymId,
		canManage,
		currentUserId: workspace.userId,
		lockTrainersToSelf,
		defaultTrainerIds: lockTrainersToSelf ? [workspace.userId] : undefined,
		initialView
	};
};

export const actions = {
	create: async ({ request }) => createClass(await request.formData()) as ClassFormState,
	update: async ({ request }) => updateClass(await request.formData()) as ClassFormState,
	setActive: async ({ request }) => {
		await setClassActive(await request.formData());
	},
	schedule: async ({ request }) =>
		createClassSchedule(await request.formData()) as ScheduleFormState,
	duplicate: async ({ request }) => duplicateClassToGym(await request.formData())
} satisfies Actions;
