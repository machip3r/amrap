import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import {
	entityNameSchema,
	formString,
	localeSchema,
	uuidSchema,
	LIMITS
} from '$lib/validation/schemas';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { z } from 'zod';

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

const optionalDescriptionSchema = z
	.string()
	.trim()
	.max(LIMITS.message)
	.optional()
	.transform((v) => (v && v.length > 0 ? v : null));

const optionalCapacitySchema = z
	.string()
	.trim()
	.optional()
	.transform((v, ctx) => {
		if (!v) return null;
		const n = Number(v);
		if (!Number.isInteger(n) || n < 1 || n > 10_000) {
			ctx.addIssue({ code: 'custom', message: 'invalid' });
			return z.NEVER;
		}
		return n;
	});

const optionalDurationSchema = z
	.string()
	.trim()
	.optional()
	.transform((v, ctx) => {
		if (!v) return 60;
		const n = Number(v);
		if (!Number.isInteger(n) || n < 1 || n > 24 * 60) {
			ctx.addIssue({ code: 'custom', message: 'invalid' });
			return z.NEVER;
		}
		return n;
	});

const optionalTagsSchema = z
	.string()
	.trim()
	.optional()
	.transform((v) =>
		v
			? v
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
					.slice(0, 12)
			: []
	);

const classFormSchema = z.object({
	locale: localeSchema,
	name: entityNameSchema,
	description: optionalDescriptionSchema,
	capacity: optionalCapacitySchema,
	duration_minutes: optionalDurationSchema,
	tags: optionalTagsSchema,
	trainer_ids: z.array(uuidSchema).default([])
});

const updateClassSchema = classFormSchema.extend({
	class_id: uuidSchema
});

export type ClassFormState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
} | null;

export type ScheduleFormState = {
	error?: string;
	fieldErrors?: Record<string, string>;
	success?: boolean;
} | null;

function trainerIdsFromForm(formData: FormData): string[] {
	return formData
		.getAll('trainer_ids')
		.map((v) => (typeof v === 'string' ? v : ''))
		.filter(Boolean);
}

function daysFromForm(formData: FormData): number[] {
	return formData
		.getAll('days_of_week')
		.map((v) => Number(typeof v === 'string' ? v : ''))
		.filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
}

async function assertTrainersInGym(gymId: string, trainerIds: string[]): Promise<boolean> {
	if (trainerIds.length === 0) return true;
	const supabase = createClient();
	const { data, error } = await supabase
		.from('gym_roles')
		.select('user_id')
		.eq('gym_id', gymId)
		.eq('role', 'TRAINER')
		.in('user_id', trainerIds);

	if (error) {
		console.error('assertTrainersInGym', error.message);
		return false;
	}
	const found = new Set((data ?? []).map((r) => r.user_id));
	return trainerIds.every((id) => found.has(id));
}

async function replaceClassTrainers(classId: string, trainerIds: string[]) {
	const supabase = createClient();
	const { error: delErr } = await supabase.from('class_trainers').delete().eq('class_id', classId);
	if (delErr) {
		console.error('replaceClassTrainers delete', delErr.message);
		return false;
	}
	if (trainerIds.length === 0) return true;
	const { error: insErr } = await supabase
		.from('class_trainers')
		.insert(trainerIds.map((user_id) => ({ class_id: classId, user_id })));
	if (insErr) {
		console.error('replaceClassTrainers insert', insErr.message);
		return false;
	}
	return true;
}

const scheduleFormSchema = z.object({
	locale: localeSchema,
	class_id: uuidSchema,
	recurrence: z.enum(['none', 'weekly']),
	days_of_week: z.array(z.number().int().min(1).max(7)).default([]),
	local_time: z.string().regex(/^\d{2}:\d{2}$/),
	timezone: z.string().trim().min(1).max(64).default('America/Mexico_City'),
	valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	valid_until: z
		.string()
		.trim()
		.optional()
		.transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
	capacity: optionalCapacitySchema,
	duration_minutes: z
		.string()
		.trim()
		.optional()
		.transform((v, ctx) => {
			if (!v) return null;
			const n = Number(v);
			if (!Number.isInteger(n) || n < 1 || n > 24 * 60) {
				ctx.addIssue({ code: 'custom', message: 'invalid' });
				return z.NEVER;
			}
			return n;
		})
});

export async function createClass(formData: FormData): Promise<ClassFormState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) {
		return { error: d.common.forbidden };
	}

	const parsed = classFormSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		name: formString(formData, 'name'),
		description: formString(formData, 'description'),
		capacity: formString(formData, 'capacity'),
		duration_minutes: formString(formData, 'duration_minutes'),
		tags: formString(formData, 'tags'),
		trainer_ids: trainerIdsFromForm(formData)
	});
	if (!parsed.success) {
		return {
			fieldErrors: zodFieldErrors(parsed.error, d.validation, {
				name: 'entityName'
			})
		};
	}

	const trainerIds =
		workspace.role === 'TRAINER' && !workspace.canActAsOwner
			? [workspace.userId]
			: parsed.data.trainer_ids;

	const okTrainers = await assertTrainersInGym(workspace.gymId, trainerIds);
	if (!okTrainers) {
		return { fieldErrors: { trainer_ids: d.validation.invalid } };
	}

	const supabase = createClient();
	const { data: inserted, error } = await supabase
		.from('classes')
		.insert({
			gym_id: workspace.gymId,
			name: parsed.data.name,
			description: parsed.data.description,
			capacity: parsed.data.capacity,
			duration_minutes: parsed.data.duration_minutes,
			tags: parsed.data.tags,
			is_active: true
		})
		.select('id')
		.single();

	if (error || !inserted) {
		console.error('createClass', error?.message);
		return { error: d.classes.error };
	}

	const assigned = await replaceClassTrainers(inserted.id, trainerIds);
	if (!assigned) {
		return { error: d.classes.error };
	}

	const withSchedule = formString(formData, 'with_schedule') === 'on';
	if (withSchedule) {
		const recurrenceRaw = formString(formData, 'recurrence') || 'weekly';
		const scheduleParsed = scheduleFormSchema.safeParse({
			locale: formString(formData, 'locale') || 'es',
			class_id: inserted.id,
			recurrence: recurrenceRaw,
			days_of_week: recurrenceRaw === 'weekly' ? daysFromForm(formData) : [],
			local_time: formString(formData, 'local_time'),
			timezone: formString(formData, 'timezone') || 'America/Mexico_City',
			valid_from: formString(formData, 'valid_from'),
			valid_until: formString(formData, 'valid_until'),
			capacity: formString(formData, 'capacity'),
			duration_minutes: formString(formData, 'duration_minutes')
		});
		if (!scheduleParsed.success) {
			return {
				fieldErrors: zodFieldErrors(scheduleParsed.error, d.validation),
				error: d.classes.scheduleCreatePartial
			};
		}
		if (
			scheduleParsed.data.recurrence === 'weekly' &&
			scheduleParsed.data.days_of_week.length === 0
		) {
			return {
				fieldErrors: { days_of_week: d.validation.invalid },
				error: d.classes.scheduleCreatePartial
			};
		}

		const { data: sched, error: schedErr } = await supabase
			.from('class_schedules')
			.insert({
				class_id: inserted.id,
				gym_id: workspace.gymId,
				recurrence: scheduleParsed.data.recurrence,
				days_of_week: scheduleParsed.data.days_of_week,
				local_time: `${scheduleParsed.data.local_time}:00`,
				timezone: scheduleParsed.data.timezone,
				valid_from: scheduleParsed.data.valid_from,
				valid_until: scheduleParsed.data.valid_until,
				capacity: scheduleParsed.data.capacity,
				duration_minutes: scheduleParsed.data.duration_minutes,
				is_active: true
			})
			.select('id')
			.single();

		if (schedErr || !sched) {
			console.error('createClass schedule', schedErr?.message);
			return { error: d.classes.scheduleCreatePartial };
		}

		const { error: genErr } = await supabase.rpc('generate_class_sessions', {
			p_schedule_id: sched.id,
			p_weeks: 12
		});
		if (genErr) {
			console.error('createClass generate_class_sessions', genErr.message);
			return { error: d.classes.scheduleCreatePartial };
		}
	}

	return { success: true };
}

export async function updateClass(formData: FormData): Promise<ClassFormState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) {
		return { error: d.common.forbidden };
	}

	const parsed = updateClassSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		class_id: formString(formData, 'class_id'),
		name: formString(formData, 'name'),
		description: formString(formData, 'description'),
		capacity: formString(formData, 'capacity'),
		duration_minutes: formString(formData, 'duration_minutes'),
		tags: formString(formData, 'tags'),
		trainer_ids: trainerIdsFromForm(formData)
	});
	if (!parsed.success) {
		return {
			fieldErrors: zodFieldErrors(parsed.error, d.validation, {
				name: 'entityName'
			})
		};
	}

	const trainerIds =
		workspace.role === 'TRAINER' && !workspace.canActAsOwner
			? Array.from(new Set([workspace.userId, ...parsed.data.trainer_ids]))
			: parsed.data.trainer_ids;

	const okTrainers = await assertTrainersInGym(workspace.gymId, trainerIds);
	if (!okTrainers) {
		return { fieldErrors: { trainer_ids: d.validation.invalid } };
	}

	const supabase = createClient();
	const { error } = await supabase
		.from('classes')
		.update({
			name: parsed.data.name,
			description: parsed.data.description,
			capacity: parsed.data.capacity,
			duration_minutes: parsed.data.duration_minutes,
			tags: parsed.data.tags,
			updated_at: new Date().toISOString()
		})
		.eq('id', parsed.data.class_id)
		.eq('gym_id', workspace.gymId);

	if (error) {
		console.error('updateClass', error.message);
		return { error: d.classes.error };
	}

	const assigned = await replaceClassTrainers(parsed.data.class_id, trainerIds);
	if (!assigned) {
		return { error: d.classes.error };
	}

	return { success: true };
}

export async function setClassActive(formData: FormData): Promise<void> {
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) {
		return;
	}

	const classId = formString(formData, 'class_id');
	const idParsed = uuidSchema.safeParse(classId);
	const activeRaw = formString(formData, 'is_active');
	if (!idParsed.success) return;

	const supabase = createClient();
	await supabase
		.from('classes')
		.update({
			is_active: activeRaw === 'true',
			updated_at: new Date().toISOString()
		})
		.eq('id', idParsed.data)
		.eq('gym_id', workspace.gymId);
}

export async function createClassSchedule(formData: FormData): Promise<ScheduleFormState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) {
		return { error: d.common.forbidden };
	}

	const recurrenceRaw = formString(formData, 'recurrence') || 'weekly';
	const parsed = scheduleFormSchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		class_id: formString(formData, 'class_id'),
		recurrence: recurrenceRaw,
		days_of_week: recurrenceRaw === 'weekly' ? daysFromForm(formData) : [],
		local_time: formString(formData, 'local_time'),
		timezone: formString(formData, 'timezone') || 'America/Mexico_City',
		valid_from: formString(formData, 'valid_from'),
		valid_until: formString(formData, 'valid_until'),
		capacity: formString(formData, 'capacity'),
		duration_minutes: formString(formData, 'duration_minutes')
	});
	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}
	if (parsed.data.recurrence === 'weekly' && parsed.data.days_of_week.length === 0) {
		return { fieldErrors: { days_of_week: d.validation.invalid } };
	}

	const supabase = createClient();
	const { data: cls } = await supabase
		.from('classes')
		.select('id')
		.eq('id', parsed.data.class_id)
		.eq('gym_id', workspace.gymId)
		.maybeSingle();
	if (!cls) return { error: d.classes.error };

	const { data: inserted, error } = await supabase
		.from('class_schedules')
		.insert({
			class_id: parsed.data.class_id,
			gym_id: workspace.gymId,
			recurrence: parsed.data.recurrence,
			days_of_week: parsed.data.days_of_week,
			local_time: `${parsed.data.local_time}:00`,
			timezone: parsed.data.timezone,
			valid_from: parsed.data.valid_from,
			valid_until: parsed.data.valid_until,
			capacity: parsed.data.capacity,
			duration_minutes: parsed.data.duration_minutes,
			is_active: true
		})
		.select('id')
		.single();

	if (error || !inserted) {
		console.error('createClassSchedule', error?.message);
		return { error: d.classes.error };
	}

	const { error: genErr } = await supabase.rpc('generate_class_sessions', {
		p_schedule_id: inserted.id,
		p_weeks: 12
	});
	if (genErr) {
		console.error('generate_class_sessions', genErr.message);
		return { error: d.classes.error };
	}

	return { success: true };
}

export async function cancelClassSession(formData: FormData): Promise<void> {
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) return;

	const sessionId = formString(formData, 'session_id');
	const idParsed = uuidSchema.safeParse(sessionId);
	if (!idParsed.success) return;

	const supabase = createClient();
	await supabase
		.from('class_sessions')
		.update({ status: 'cancelled', updated_at: new Date().toISOString() })
		.eq('id', idParsed.data)
		.eq('gym_id', workspace.gymId);
}

export async function bookClassForMember(
	formData: FormData
): Promise<{ error?: string; success?: boolean }> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (
		!workspace ||
		(!canInWorkspace(workspace, 'manage_classes') && !canInWorkspace(workspace, 'checkin'))
	) {
		return { error: d.common.forbidden };
	}

	const sessionId = uuidSchema.safeParse(formString(formData, 'session_id'));
	const personId = uuidSchema.safeParse(formString(formData, 'person_id'));
	if (!sessionId.success || !personId.success) {
		return { error: d.validation.invalid };
	}

	const supabase = createClient();
	const { error } = await supabase.rpc('book_class_session', {
		p_session_id: sessionId.data,
		p_person_id: personId.data,
		p_membership_id: null
	});
	if (error) {
		console.error('bookClassForMember', error.message);
		return { error: d.classes.bookError };
	}

	return { success: true };
}

export async function cancelBookingStaff(formData: FormData): Promise<void> {
	const workspace = await getWorkspace();
	if (
		!workspace ||
		(!canInWorkspace(workspace, 'manage_classes') && !canInWorkspace(workspace, 'checkin'))
	) {
		return;
	}

	const bookingId = uuidSchema.safeParse(formString(formData, 'booking_id'));
	if (!bookingId.success) return;

	const supabase = createClient();
	await supabase.rpc('cancel_class_booking', {
		p_booking_id: bookingId.data
	});
}

export async function setBookingStatusStaff(formData: FormData): Promise<void> {
	const workspace = await getWorkspace();
	if (
		!workspace ||
		(!canInWorkspace(workspace, 'checkin') && !canInWorkspace(workspace, 'manage_classes'))
	) {
		return;
	}

	const bookingId = uuidSchema.safeParse(formString(formData, 'booking_id'));
	const status = formString(formData, 'status');
	if (!bookingId.success) return;
	if (!['attended', 'no_show', 'confirmed'].includes(status)) return;

	const supabase = createClient();
	await supabase.rpc('set_class_booking_status', {
		p_booking_id: bookingId.data,
		p_status: status
	});
}

export async function duplicateClassToGym(
	formData: FormData
): Promise<{ error?: string; success?: boolean }> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) {
		return { error: d.common.forbidden };
	}

	const classId = uuidSchema.safeParse(formString(formData, 'class_id'));
	const targetGymId = uuidSchema.safeParse(formString(formData, 'target_gym_id'));
	if (!classId.success || !targetGymId.success) {
		return { error: d.validation.invalid };
	}

	const supabase = createClient();
	const { error } = await supabase.rpc('duplicate_class_to_gym', {
		p_class_id: classId.data,
		p_target_gym_id: targetGymId.data
	});
	if (error) {
		console.error('duplicateClassToGym', error.message);
		return { error: d.classes.duplicateError };
	}

	return { success: true };
}

export async function upsertSessionResult(
	formData: FormData
): Promise<{ error?: string; success?: boolean }> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);
	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_classes')) {
		return { error: d.common.forbidden };
	}

	const sessionId = uuidSchema.safeParse(formString(formData, 'session_id'));
	const personId = uuidSchema.safeParse(formString(formData, 'person_id'));
	const kindRaw = formString(formData, 'kind');
	if (!sessionId.success || !personId.success) {
		return { error: d.validation.invalid };
	}
	if (!['amrap', 'strength', 'for_time', 'other'].includes(kindRaw)) {
		return { error: d.validation.invalid };
	}

	const roundsRaw = formString(formData, 'rounds');
	const repsRaw = formString(formData, 'reps');
	const weightRaw = formString(formData, 'weight_kg');
	const minsRaw = formString(formData, 'time_minutes');
	const secsPartRaw = formString(formData, 'time_seconds_part');

	const parseOptionalInt = (v: string) => {
		if (!v.trim()) return null;
		const n = Number(v);
		if (!Number.isInteger(n) || n < 0) return undefined;
		return n;
	};
	const parseOptionalNum = (v: string) => {
		if (!v.trim()) return null;
		const n = Number(v);
		if (!Number.isFinite(n) || n < 0) return undefined;
		return n;
	};

	let rounds: number | null = null;
	let reps: number | null = null;
	let weightKg: number | null = null;
	let timeSeconds: number | null = null;

	if (kindRaw === 'amrap') {
		const r = parseOptionalInt(roundsRaw);
		const rp = parseOptionalInt(repsRaw);
		if (r === undefined || rp === undefined) {
			return { error: d.validation.invalid };
		}
		rounds = r;
		reps = rp;
	} else if (kindRaw === 'strength') {
		const w = parseOptionalNum(weightRaw);
		if (w === undefined) return { error: d.validation.invalid };
		weightKg = w;
	} else if (kindRaw === 'for_time') {
		const mins = parseOptionalInt(minsRaw);
		const secs = parseOptionalInt(secsPartRaw);
		if (mins === undefined || secs === undefined) {
			return { error: d.validation.invalid };
		}
		timeSeconds = (mins ?? 0) * 60 + (secs ?? 0);
	}

	const supabase = createClient();
	const { data: session } = await supabase
		.from('class_sessions')
		.select('id, gym_id')
		.eq('id', sessionId.data)
		.maybeSingle();

	if (!session || session.gym_id !== workspace.gymId) {
		return { error: d.common.forbidden };
	}

	const { error } = await supabase.from('class_session_results').upsert(
		{
			session_id: sessionId.data,
			person_id: personId.data,
			gym_id: workspace.gymId,
			kind: kindRaw,
			rounds,
			reps,
			weight_kg: weightKg,
			time_seconds: timeSeconds,
			recorded_by: workspace.userId,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'session_id,person_id' }
	);

	if (error) {
		console.error('upsertSessionResult', error.message);
		return { error: d.validation.invalid };
	}

	return { success: true };
}
