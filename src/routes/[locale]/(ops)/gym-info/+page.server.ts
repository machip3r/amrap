import { redirect } from '@sveltejs/kit';
import { canInWorkspace } from '$lib/auth/permissions';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import {
	entityNameSchema,
	formString,
	formWeekdays,
	gymScheduleSchema,
	localeSchema,
	optionalAddressSchema,
	optionalEntityNameSchema
} from '$lib/validation/schemas';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { locale, workspace } = await parent();
	const d = getDictionary(locale as Locale);
	if (!workspace) throw redirect(303, `/${locale}/login`);

	if (!canInWorkspace(workspace, 'manage_billing')) {
		return {
			forbidden: true as const,
			locale: locale as Locale,
			d
		};
	}

	const supabase = createClient();
	const [{ data: gymRow }, { data: branchRow }] = await Promise.all([
		supabase
			.from('gyms')
			.select(
				'id, name, address, schedule_enabled_days, schedule_open_time, schedule_close_time'
			)
			.eq('id', workspace.gymId)
			.maybeSingle(),
		supabase
			.from('branches')
			.select('id, name')
			.eq('gym_id', workspace.gymId)
			.order('created_at', { ascending: true })
			.limit(1)
			.maybeSingle()
	]);

	return {
		forbidden: false as const,
		locale: locale as Locale,
		d,
		gymId: workspace.gymId,
		gymName: gymRow?.name ?? '',
		gymAddress: gymRow?.address ?? '',
		branchId: branchRow?.id ?? null,
		branchName: branchRow?.name ?? '',
		scheduleEnabledDays: (gymRow?.schedule_enabled_days as string[] | null) ?? null,
		scheduleOpenTime: (gymRow?.schedule_open_time as string | null) ?? null,
		scheduleCloseTime: (gymRow?.schedule_close_time as string | null) ?? null
	};
};

const gymInfoSchema = z.object({
	locale: localeSchema,
	gymName: entityNameSchema,
	gymAddress: optionalAddressSchema,
	branchName: optionalEntityNameSchema
});

type GymInfoActionState = {
	success?: boolean;
	error?: string;
	fieldErrors?: Record<string, string>;
} | null;

export const actions = {
	save: async ({ request }): Promise<GymInfoActionState> => {
		const formData = await request.formData();
		const localeRaw = formString(formData, 'locale') || 'es';
		const localeParsed = localeSchema.safeParse(localeRaw);
		const locale = localeParsed.success ? localeParsed.data : ('es' as const);
		const d = getDictionary(locale);

		const supabase = createClient();

		const { getWorkspace } = await import('$lib/auth/session');
		const workspace = await getWorkspace();
		if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
			return { error: d.common.forbidden };
		}

		// Parse gym info
		const infoParsed = gymInfoSchema.safeParse({
			locale: localeRaw,
			gymName: formString(formData, 'gymName'),
			gymAddress: formString(formData, 'gymAddress'),
			branchName: formString(formData, 'branchName')
		});
		if (!infoParsed.success) {
			return { fieldErrors: zodFieldErrors(infoParsed.error, d.validation) };
		}

		// Parse schedule
		const scheduleParsed = gymScheduleSchema.safeParse({
			schedule_days: formWeekdays(formData),
			schedule_open_time: formString(formData, 'schedule_open_time'),
			schedule_close_time: formString(formData, 'schedule_close_time')
		});
		if (!scheduleParsed.success) {
			return { fieldErrors: zodFieldErrors(scheduleParsed.error, d.validation) };
		}

		// Update gym
		const { error: gymErr } = await supabase
			.from('gyms')
			.update({
				name: infoParsed.data.gymName,
				address: infoParsed.data.gymAddress,
				schedule_enabled_days: scheduleParsed.data.schedule_days,
				schedule_open_time: `${scheduleParsed.data.schedule_open_time}:00`,
				schedule_close_time: `${scheduleParsed.data.schedule_close_time}:00`
			})
			.eq('id', workspace.gymId);

		if (gymErr) {
			console.error('gymInfo save gym', gymErr.message);
			return { error: d.gymInfo.error };
		}

		// Update branch name if provided
		const branchId = formString(formData, 'branchId');
		if (branchId && infoParsed.data.branchName) {
			await supabase
				.from('branches')
				.update({ name: infoParsed.data.branchName })
				.eq('id', branchId)
				.eq('gym_id', workspace.gymId);
		}

		return { success: true };
	}
} satisfies Actions;
