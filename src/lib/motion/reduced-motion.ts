/** Client-safe check for `prefers-reduced-motion: reduce`. */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Return `ms` unless the user prefers reduced motion (then `0`). */
export function motionDuration(ms: number): number {
	return prefersReducedMotion() ? 0 : ms;
}
