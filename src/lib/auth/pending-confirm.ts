import { getRequestEvent } from '$app/server';
import { emailSchema, entityNameSchema } from '$lib/validation/schemas';

export const PENDING_CONFIRM_EMAIL_COOKIE = 'amrap_pending_confirm_email';
export const PENDING_ORG_NAME_COOKIE = 'amrap_pending_org_name';

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function cookies() {
	return getRequestEvent().cookies;
}

const cookieOpts = {
	path: '/',
	sameSite: 'lax' as const,
	httpOnly: true,
	secure: import.meta.env.PROD,
	maxAge: MAX_AGE_SEC
};

export async function getPendingConfirmEmail(): Promise<string | null> {
	const parsed = emailSchema.safeParse(cookies().get(PENDING_CONFIRM_EMAIL_COOKIE) ?? '');
	return parsed.success ? parsed.data : null;
}

export async function getPendingOrganizationName(): Promise<string | null> {
	const parsed = entityNameSchema.safeParse(cookies().get(PENDING_ORG_NAME_COOKIE) ?? '');
	return parsed.success ? parsed.data : null;
}

export async function setPendingConfirmSignup(input: {
	email: string;
	organizationName: string;
}): Promise<void> {
	const emailParsed = emailSchema.safeParse(input.email);
	const orgParsed = entityNameSchema.safeParse(input.organizationName);
	if (!emailParsed.success || !orgParsed.success) return;
	cookies().set(PENDING_CONFIRM_EMAIL_COOKIE, emailParsed.data, cookieOpts);
	cookies().set(PENDING_ORG_NAME_COOKIE, orgParsed.data, cookieOpts);
}

export async function setPendingConfirmEmail(email: string): Promise<void> {
	const parsed = emailSchema.safeParse(email);
	if (!parsed.success) return;
	cookies().set(PENDING_CONFIRM_EMAIL_COOKIE, parsed.data, cookieOpts);
}

export async function clearPendingConfirmEmail(): Promise<void> {
	cookies().delete(PENDING_CONFIRM_EMAIL_COOKIE, { path: '/' });
	cookies().delete(PENDING_ORG_NAME_COOKIE, { path: '/' });
}
