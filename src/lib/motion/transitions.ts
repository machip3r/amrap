import { cubicOut, quintOut } from 'svelte/easing';
import { motionDuration } from './reduced-motion';

/** Shared fade for overlays / soft UI. */
export function uiFade(ms = 180) {
	return { duration: motionDuration(ms) };
}

/** Shared fly for dialogs / sheets (slight rise). */
export function uiFly(ms = 280, y = 16) {
	return { duration: motionDuration(ms), y, easing: cubicOut };
}

/** Soft scale for confirmations / success pops. */
export function uiScale(ms = 220) {
	return { duration: motionDuration(ms), start: 0.96, easing: quintOut };
}

/** Landing FAQ / accordion panel. */
export function accordionSlide(ms = 260) {
	return { duration: motionDuration(ms), easing: cubicOut };
}
