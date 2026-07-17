import { redirect, type RequestHandler } from '@sveltejs/kit';
import { ensureOrganizationAfterConfirm } from '$lib/auth/ensure-organization';
import {
	isInvitedOpsUser,
	resolvePostAuthPath
} from '$lib/auth/post-auth-redirect';
import { getOnboardingState, getSessionUser } from '$lib/auth/session';
import { defaultLocale, isLocale } from '$lib/i18n/config';

export const GET: RequestHandler = async ({ url }) => {
	const localeRaw = url.searchParams.get('locale') ?? defaultLocale;
	const locale = isLocale(localeRaw) ? localeRaw : defaultLocale;

	const user = await getSessionUser();
	if (!user) throw redirect(302, `/${locale}/login`);

	const [invitedOps, before] = await Promise.all([isInvitedOpsUser(), getOnboardingState()]);

	if (invitedOps) {
		throw redirect(302, await resolvePostAuthPath(locale));
	}

	if (before?.organizationId) {
		throw redirect(302, `/${locale}/onboarding`);
	}

	const result = await ensureOrganizationAfterConfirm(user.email ?? 'user');
	if (!result.ok) {
		console.error('ensure-organization route', result.error);
		throw redirect(302, `/${locale}/onboarding?error=org`);
	}

	throw redirect(302, `/${locale}/onboarding`);
};
