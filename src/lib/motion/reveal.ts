import type { Action } from 'svelte/action';
import { prefersReducedMotion } from './reduced-motion';

export type RevealOptions = {
	/** IntersectionObserver rootMargin (default: reveal a bit before fully in view). */
	rootMargin?: string;
	threshold?: number;
	/** Only animate the first time (default true). */
	once?: boolean;
	/** Extra delay in ms after intersection (also sets CSS `--reveal-delay`). */
	delay?: number;
};

/**
 * Scroll-driven entrance for landing / marketing sections.
 * Adds `.motion-reveal` then `.motion-reveal--in` when visible.
 * No-ops (instant visible) when `prefers-reduced-motion`.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = {}) => {
	const opts = {
		rootMargin: '0px 0px -8% 0px',
		threshold: 0.12,
		once: true,
		delay: 0,
		...options
	};

	node.classList.add('motion-reveal');
	node.style.setProperty('--reveal-delay', `${opts.delay}ms`);

	if (prefersReducedMotion()) {
		node.classList.add('motion-reveal--in');
		return {};
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) {
					if (!opts.once) node.classList.remove('motion-reveal--in');
					continue;
				}
				node.classList.add('motion-reveal--in');
				if (opts.once) observer.unobserve(node);
			}
		},
		{ rootMargin: opts.rootMargin, threshold: opts.threshold }
	);

	observer.observe(node);

	return {
		update(next) {
			const delay = next?.delay ?? opts.delay;
			node.style.setProperty('--reveal-delay', `${delay}ms`);
		},
		destroy() {
			observer.disconnect();
		}
	};
};
