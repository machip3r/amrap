/** Client cache so the PWA splash can show the gym mark before layouts load. */

export const BOOT_LOGO_STORAGE_KEY = 'amrap-boot-logo';

export type BootLogoCache = {
	light: string | null;
	dark: string | null;
	name?: string;
};

export function readBootLogo(): BootLogoCache | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(BOOT_LOGO_STORAGE_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as BootLogoCache;
		if (!data || (typeof data !== 'object')) return null;
		const light = typeof data.light === 'string' && data.light ? data.light : null;
		const dark = typeof data.dark === 'string' && data.dark ? data.dark : null;
		if (!light && !dark) return null;
		return {
			light,
			dark,
			name: typeof data.name === 'string' ? data.name : undefined
		};
	} catch {
		return null;
	}
}

/** Persist gym logos for the next cold start, or clear when unbranded. */
export function persistBootLogo(input: {
	logoUrlLight?: string | null;
	logoUrlDark?: string | null;
	name?: string | null;
	allowBrand?: boolean;
}): void {
	if (typeof localStorage === 'undefined') return;
	try {
		const allow = Boolean(input.allowBrand);
		const light = allow && input.logoUrlLight?.trim() ? input.logoUrlLight.trim() : null;
		const dark = allow && input.logoUrlDark?.trim() ? input.logoUrlDark.trim() : null;
		if (!light && !dark) {
			localStorage.removeItem(BOOT_LOGO_STORAGE_KEY);
			return;
		}
		const payload: BootLogoCache = {
			light: light || dark,
			dark: dark || light,
			name: input.name?.trim() || undefined
		};
		localStorage.setItem(BOOT_LOGO_STORAGE_KEY, JSON.stringify(payload));
	} catch {
		/* ignore quota / private mode */
	}
}
