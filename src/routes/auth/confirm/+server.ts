import { redirect, type RequestHandler } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import { ensureOrganizationAfterConfirm } from '$lib/auth/ensure-organization';
import { resolvePostAuthPath } from '$lib/auth/post-auth-redirect';
import { invitePath } from '$lib/auth/invite-decision';
import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
import { createClient } from '$lib/supabase/server';

const OTP_TYPES = new Set<string>([
	'signup',
	'invite',
	'magiclink',
	'recovery',
	'email_change',
	'email'
]);

function safeNextPath(raw: string | null): string {
	if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
		return `/${defaultLocale}/onboarding`;
	}
	return raw;
}

function localeFromPath(path: string): Locale {
	const first = path.split('/').filter(Boolean)[0];
	return isLocale(first ?? '') ? (first as Locale) : defaultLocale;
}

export const GET: RequestHandler = async ({ url }) => {
	const token_hash = url.searchParams.get('token_hash');
	const typeRaw = url.searchParams.get('type');
	const next = safeNextPath(url.searchParams.get('next'));
	const locale = localeFromPath(next);

	const supabase = createClient();
	const {
		data: { user: existingUser }
	} = await supabase.auth.getUser();

	if (existingUser) {
		throw redirect(302, await resolvePostAuthPath(locale));
	}

	if (token_hash && typeRaw && OTP_TYPES.has(typeRaw)) {
		const { data, error } = await supabase.auth.verifyOtp({
			type: typeRaw as EmailOtpType,
			token_hash
		});
		if (!error) {
			const email = data.user?.email ?? '';
			if (email && typeRaw === 'signup') {
				await ensureOrganizationAfterConfirm(email);
			}

			if (typeRaw === 'recovery' || typeRaw === 'email_change') {
				throw redirect(302, next);
			}

			if (typeRaw === 'invite' || typeRaw === 'magiclink') {
				throw redirect(302, invitePath(locale));
			}

			throw redirect(302, await resolvePostAuthPath(locale));
		}
		console.error('auth/confirm', error.message);
	}

	throw redirect(302, `/${locale}/login`);
};
