import { redirect } from '@sveltejs/kit';
import { getMemberContext } from '$lib/auth/member-session';
import { getPersonProfileStatus } from '$lib/auth/profile-onboarding';
import { getSessionUser, getWorkspace } from '$lib/auth/session';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { formString, localeSchema } from '$lib/validation/schemas';
import { z } from 'zod';

export type FeedbackFormState = {
	error?: string;
	success?: boolean;
	fieldErrors?: Record<string, string>;
} | null;

const feedbackSchema = z.object({
	locale: localeSchema,
	target: z.enum(['GYM', 'AMRAP']),
	body: z.string().trim().min(1).max(4000)
});

/**
 * Members, staff, and trainers may compose feedback.
 * Owners and provisional owners only read gym feedback (elsewhere).
 */
export async function canComposeFeedback(): Promise<boolean> {
	const workspace = await getWorkspace();
	if (workspace?.canActAsOwner) return false;
	if (workspace && (workspace.role === 'STAFF' || workspace.role === 'TRAINER')) {
		return true;
	}
	const member = await getMemberContext();
	return Boolean(member);
}

export async function submitFeedbackAction(formData: FormData): Promise<FeedbackFormState> {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	const locale = (localeParsed.success ? localeParsed.data : 'es') as Locale;
	const d = getDictionary(locale);

	const user = await getSessionUser();
	if (!user) throw redirect(303, `/${locale}/login`);

	if (!(await canComposeFeedback())) {
		return { error: d.member.feedbackForbidden };
	}

	const parsed = feedbackSchema.safeParse({
		locale: localeRaw,
		target: formString(formData, 'target') || 'GYM',
		body: formString(formData, 'body')
	});

	if (!parsed.success) {
		return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
	}

	const workspace = await getWorkspace();
	const member = await getMemberContext();
	const gymId = workspace?.gymId ?? member?.activeGymId;
	if (!gymId) {
		return { error: d.member.feedbackError };
	}

	const profile = await getPersonProfileStatus();
	const authorPersonId = profile?.personId ?? member?.personId ?? null;

	const supabase = createClient();
	const { error } = await supabase.from('feedback_messages').insert({
		gym_id: gymId,
		target: parsed.data.target,
		body: parsed.data.body,
		author_person_id: authorPersonId
	});

	if (error) {
		console.error('submitFeedbackAction', error.message);
		return { error: d.member.feedbackError };
	}

	return { success: true };
}
