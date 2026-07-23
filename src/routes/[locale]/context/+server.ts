import { error, redirect } from '@sveltejs/kit';
import {
	activateIdentity,
	listUserIdentities,
	type IdentityKind
} from '$lib/auth/identities';
import { isLocale, type Locale } from '$lib/i18n/config';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const gymIdSchema = z.string().uuid();

/**
 * Activate an identity (ops or member at a gym) and land on the matching shell.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	if (!isLocale(params.locale)) error(404);
	const locale = params.locale as Locale;

	const kindRaw = url.searchParams.get('kind');
	const gymIdRaw = url.searchParams.get('gymId');
	if (kindRaw !== 'ops' && kindRaw !== 'member') error(400);
	const gymParsed = gymIdSchema.safeParse(gymIdRaw);
	if (!gymParsed.success) error(400);

	const kind = kindRaw as IdentityKind;
	const gymId = gymParsed.data;

	const identities = await listUserIdentities();
	const match = identities.find((i) => i.kind === kind && i.gymId === gymId);
	if (!match) error(403);

	activateIdentity(kind, gymId);

	throw redirect(303, kind === 'ops' ? `/${locale}/dashboard` : `/${locale}/me`);
};
