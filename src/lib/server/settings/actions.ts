import { getWorkspace } from '$lib/auth/session';
import { canInWorkspace } from '$lib/auth/permissions';
import { getPaletteTemplate } from '$lib/branding/palettes';
import { gymLogoPublicUrl } from '$lib/branding/logo';
import { getDictionary } from '$lib/i18n/dictionaries';
import {
	getCustomizableOpsNavItems,
	isCustomizableOpsNavId,
	roleAllowsNavCustomization
} from '$lib/nav/ops-nav';
import { canUseWhitelabel } from '$lib/plans/limits';
import { createClient } from '$lib/supabase/server';
import { zodFieldErrors } from '$lib/validation/field-errors';
import { formString, localeSchema } from '$lib/validation/schemas';
import { z } from 'zod';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

export type SettingsActionState = {
	/** Discriminator so gateway UI does not consume branding/nav results. */
	form: 'branding' | 'nav';
	error?: string;
	success?: string;
	fieldErrors?: Record<string, string>;
	logoMode?: 'light' | 'dark';
	logoUrl?: string | null;
} | null;

function brandingState(
	state: Omit<NonNullable<SettingsActionState>, 'form'>
): NonNullable<SettingsActionState> {
	return { form: 'branding', ...state };
}

function navState(
	state: Omit<NonNullable<SettingsActionState>, 'form'>
): NonNullable<SettingsActionState> {
	return { form: 'nav', ...state };
}

function localeFromForm(formData: FormData) {
	const localeRaw = formString(formData, 'locale') || 'es';
	const localeParsed = localeSchema.safeParse(localeRaw);
	return localeParsed.success ? localeParsed.data : ('es' as const);
}

const logoModeSchema = z.enum(['light', 'dark']);

function extForMime(mime: string): string {
	switch (mime) {
		case 'image/png':
			return 'png';
		case 'image/webp':
			return 'webp';
		case 'image/svg+xml':
			return 'svg';
		default:
			return 'jpg';
	}
}

export async function applyPaletteTemplateAction(
	formData: FormData
): Promise<SettingsActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);

	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return brandingState({ error: d.common.forbidden });
	}
	if (!canUseWhitelabel(workspace.planTier)) {
		return brandingState({ error: d.settings.whitelabelLocked });
	}

	const template = getPaletteTemplate(formString(formData, 'paletteId'));
	if (!template) {
		return brandingState({ error: d.settings.error });
	}

	const supabase = createClient();
	const { error } = await supabase.rpc('update_gym_branding', {
		p_gym_id: workspace.gymId,
		p_theme_light: template.light,
		p_theme_dark: template.dark
	});

	if (error) {
		console.error('applyPaletteTemplateAction', error.message);
		return brandingState({ error: d.settings.error });
	}

	return brandingState({ success: d.settings.saved });
}

export async function uploadGymLogoAction(formData: FormData): Promise<SettingsActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);

	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return brandingState({ error: d.common.forbidden });
	}
	if (!canUseWhitelabel(workspace.planTier)) {
		return brandingState({ error: d.settings.whitelabelLocked });
	}

	const modeParsed = logoModeSchema.safeParse(formString(formData, 'mode'));
	if (!modeParsed.success) {
		return brandingState({ error: d.settings.error });
	}
	const mode = modeParsed.data;

	const file = formData.get('logo');
	if (!(file instanceof File) || file.size === 0) {
		return brandingState({ fieldErrors: { logo: d.validation.required } });
	}
	if (file.size > LOGO_MAX_BYTES || !LOGO_MIME.has(file.type)) {
		return brandingState({ fieldErrors: { logo: d.settings.logoHint } });
	}

	const supabase = createClient();
	const ext = extForMime(file.type);
	const path = `${workspace.gymId}/logo-${mode}.${ext}`;
	const bytes = new Uint8Array(await file.arrayBuffer());

	const { error: uploadError } = await supabase.storage.from('gym-logos').upload(path, bytes, {
		contentType: file.type,
		upsert: true,
		cacheControl: '3600'
	});

	if (uploadError) {
		console.error('uploadGymLogoAction upload', uploadError.message);
		return brandingState({ error: d.settings.logoError });
	}

	const { error } = await supabase.rpc('update_gym_branding', {
		p_gym_id: workspace.gymId,
		...(mode === 'light' ? { p_logo_url_light: path } : { p_logo_url_dark: path })
	});

	if (error) {
		console.error('uploadGymLogoAction rpc', error.message);
		return brandingState({ error: d.settings.logoError });
	}

	const { data: gymRow } = await supabase
		.from('gyms')
		.select('logo_url_light, logo_url_dark, updated_at')
		.eq('id', workspace.gymId)
		.maybeSingle();

	const storedPath = mode === 'light' ? gymRow?.logo_url_light : gymRow?.logo_url_dark;
	if (!storedPath) {
		console.error('uploadGymLogoAction missing path after rpc', mode);
		return brandingState({ error: d.settings.logoError });
	}

	const logoUrl = gymLogoPublicUrl(storedPath, gymRow?.updated_at ?? Date.now());

	return brandingState({ success: d.settings.saved, logoMode: mode, logoUrl });
}

export async function removeGymLogoAction(formData: FormData): Promise<SettingsActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);

	const workspace = await getWorkspace();
	if (!workspace || !canInWorkspace(workspace, 'manage_billing')) {
		return brandingState({ error: d.common.forbidden });
	}
	if (!canUseWhitelabel(workspace.planTier)) {
		return brandingState({ error: d.settings.whitelabelLocked });
	}

	const modeParsed = logoModeSchema.safeParse(formString(formData, 'mode'));
	if (!modeParsed.success) {
		return brandingState({ error: d.settings.error });
	}
	const mode = modeParsed.data;

	const supabase = createClient();

	await Promise.all(
		['png', 'jpg', 'jpeg', 'webp', 'svg'].map((ext) =>
			supabase.storage.from('gym-logos').remove([`${workspace.gymId}/logo-${mode}.${ext}`])
		)
	);

	const { error } = await supabase.rpc('update_gym_branding', {
		p_gym_id: workspace.gymId,
		...(mode === 'light' ? { p_clear_logo_light: true } : { p_clear_logo_dark: true })
	});

	if (error) {
		console.error('removeGymLogoAction', error.message);
		return brandingState({ error: d.settings.logoError });
	}

	return brandingState({
		success: d.settings.saved,
		logoMode: mode,
		logoUrl: null
	});
}

const navVisibilitySchema = z.object({
	locale: localeSchema,
	hidden: z.array(z.string().max(40)).max(32)
});

export async function saveNavVisibilityAction(formData: FormData): Promise<SettingsActionState> {
	const locale = localeFromForm(formData);
	const d = getDictionary(locale);

	const workspace = await getWorkspace();
	if (!workspace) {
		return navState({ error: d.common.forbidden });
	}

	const hiddenRaw = formData.getAll('hidden').filter((v): v is string => typeof v === 'string');

	const parsed = navVisibilitySchema.safeParse({
		locale: formString(formData, 'locale') || 'es',
		hidden: hiddenRaw
	});
	if (!parsed.success) {
		return navState({ fieldErrors: zodFieldErrors(parsed.error, d.validation) });
	}

	const hidden = parsed.data.hidden.filter(isCustomizableOpsNavId);
	const uniqueFromForm = [...new Set(hidden)];

	const navRole = workspace.canActAsOwner ? 'OWNER' : workspace.role;
	const navCtx = {
		role: navRole,
		canManageSettings: canInWorkspace(workspace, 'manage_billing'),
		canManageStaff: canInWorkspace(workspace, 'manage_staff')
	};

	if (!roleAllowsNavCustomization(navCtx)) {
		return navState({ error: d.common.forbidden });
	}

	const allowedIds = new Set<string>(getCustomizableOpsNavItems(navCtx).map((item) => item.id));

	const fromForm = uniqueFromForm.filter((id) => allowedIds.has(id) && id !== 'dashboard');
	const preserved = workspace.hiddenNavIds.filter(
		(id) => !allowedIds.has(id) && id !== 'dashboard'
	);
	const unique = [...new Set([...preserved, ...fromForm])];

	const supabase = createClient();
	const { error } = await supabase.rpc('update_my_nav_visibility', {
		p_gym_id: workspace.gymId,
		p_nav_visibility: { hidden: unique }
	});

	if (error) {
		console.error('saveNavVisibilityAction', error.message);
		return navState({ error: d.settings.error });
	}

	return navState({ success: d.settings.saved });
}
