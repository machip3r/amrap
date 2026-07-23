import { onNavigate } from '$app/navigation';
import { prefersReducedMotion } from './reduced-motion';

/**
 * Enable soft cross-fade between client-side navigations via the
 * View Transitions API. Safe no-op when unsupported or reduced-motion.
 * Call once from the root layout during component init.
 *
 * Skips transitions on history back/forward — especially iOS edge-swipe,
 * where the browser already runs a UA visual transition. Fighting that
 * causes a flash of the current page before the previous one settles.
 */
export function enableViewTransitions() {
	onNavigate((navigation) => {
		if (typeof document === 'undefined') return;
		const start = document.startViewTransition;
		if (!start) return;
		if (prefersReducedMotion()) return;

		if (navigation.type === 'popstate') return;

		return new Promise<void>((resolve) => {
			start.call(document, async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
}
