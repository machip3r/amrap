import { browser } from '$app/environment';

/** True when running as an installed PWA (home-screen / standalone). */
export function isStandalonePwa(): boolean {
	if (!browser) return false;
	try {
		if (window.matchMedia('(display-mode: standalone)').matches) return true;
		if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
		const nav = navigator as Navigator & { standalone?: boolean };
		return nav.standalone === true;
	} catch {
		return false;
	}
}
