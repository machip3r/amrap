import { redirect } from '@sveltejs/kit';
import { getPendingConfirmEmail } from '$lib/auth/pending-confirm';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { getSessionUser } from '$lib/auth/session';
import type { Locale } from '$lib/i18n/config';
import { getDictionary } from '$lib/i18n/dictionaries';
import { registerAction } from '$lib/server/auth/register';
import {
	clearPendingConfirmAction,
	resendSignupOtpAction,
	verifySignupOtpAction
} from '$lib/server/auth/confirm-email';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const locale = params.locale as Locale;
	const user = await getSessionUser();

	if (user) {
		throw redirect(302, await resolvePostAuthPath(locale));
	}

	const pendingEmail = await getPendingConfirmEmail();

	return {
		d: getDictionary(locale),
		locale,
		pendingEmail,
		showConfirm: Boolean(pendingEmail)
	};
};

export const actions = {
	register: async ({ request }) => registerAction(await request.formData()),
	verifyOtp: async ({ request }) => verifySignupOtpAction(await request.formData()),
	resendOtp: async ({ request }) => resendSignupOtpAction(await request.formData()),
	clearPending: async ({ request }) => clearPendingConfirmAction(await request.formData())
} satisfies Actions;
