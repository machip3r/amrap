import { redirect } from '@sveltejs/kit';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import {
	getPersonProfileStatus,
	resolveWelcomeRole
} from '$lib/auth/profile-onboarding';
import { getSessionUser } from '$lib/auth/session';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import {
	dateOfBirthSchema,
	formString,
	heightCmSchema,
	genderSchema,
	localeSchema,
	weightKgSchema
} from '$lib/validation/schemas';
import { z } from 'zod';

export type WelcomeActionState = {
	error?: string;
	fieldErrors?: Record<string, string>;
} | null;

const teamSchema = z.object({
	locale: localeSchema,
	date_of_birth: dateOfBirthSchema
});

const memberSchema = z.object({
	locale: localeSchema,
	date_of_birth: dateOfBirthSchema,
	gender: genderSchema,
	height_cm: heightCmSchema,
	weight_kg: weightKgSchema
});

export async function completeWelcomeProfileAction(
	formData: FormData
): Promise<WelcomeActionState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = localeParsed.success ? localeParsed.data : 'es';
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	const profile = await getPersonProfileStatus();
	if (!profile) return { error: d.welcome.errorSave };
	if (profile.profileCompleted) throw redirect(303, await resolvePostAuthPath(locale));

	const role = await resolveWelcomeRole();
	if (!role) return { error: d.welcome.errorSave };

	if (role === 'member') {
		const parsed = memberSchema.safeParse({
			locale: localeRaw,
			date_of_birth: formString(formData, 'date_of_birth'),
			gender: formString(formData, 'gender'),
			height_cm: formString(formData, 'height_cm'),
			weight_kg: formString(formData, 'weight_kg')
		});

		if (!parsed.success) {
			return {
				fieldErrors: zodFieldErrors(parsed.error, d.validation, {
					date_of_birth: 'date',
					gender: 'required',
					height_cm: 'amount',
					weight_kg: 'amount'
				})
			};
		}

		const supabase = createClient();
		const { error } = await supabase
			.from('persons')
			.update({
				date_of_birth: parsed.data.date_of_birth,
				gender: parsed.data.gender,
				height_cm: parsed.data.height_cm,
				weight_kg: parsed.data.weight_kg,
				profile_completed_at: new Date().toISOString()
			})
			.eq('id', profile.personId)
			.eq('user_id', user.id);

		if (error) {
			console.error('completeWelcomeProfileAction', error.message);
			return { error: d.welcome.errorSave };
		}
	} else {
		const parsed = teamSchema.safeParse({
			locale: localeRaw,
			date_of_birth: formString(formData, 'date_of_birth')
		});

		if (!parsed.success) {
			return {
				fieldErrors: zodFieldErrors(parsed.error, d.validation, {
					date_of_birth: 'date'
				})
			};
		}

		const supabase = createClient();
		const { error } = await supabase
			.from('persons')
			.update({
				date_of_birth: parsed.data.date_of_birth,
				profile_completed_at: new Date().toISOString()
			})
			.eq('id', profile.personId)
			.eq('user_id', user.id);

		if (error) {
			console.error('completeWelcomeProfileAction', error.message);
			return { error: d.welcome.errorSave };
		}
	}

	throw redirect(303, await resolvePostAuthPath(locale));
}
