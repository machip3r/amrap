/** Read resolved `env(safe-area-inset-*)` values in px (iOS PWA / notch). */
let probe: HTMLDivElement | null = null;

export function getSafeAreaInsets(): {
	top: number;
	right: number;
	bottom: number;
	left: number;
} {
	if (typeof document === 'undefined') {
		return { top: 0, right: 0, bottom: 0, left: 0 };
	}
	if (!probe) {
		probe = document.createElement('div');
		probe.setAttribute('aria-hidden', 'true');
		probe.style.cssText =
			'position:fixed;inset:0;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);pointer-events:none;visibility:hidden;z-index:-1';
		document.documentElement.appendChild(probe);
	}
	const cs = getComputedStyle(probe);
	return {
		top: Number.parseFloat(cs.paddingTop) || 0,
		right: Number.parseFloat(cs.paddingRight) || 0,
		bottom: Number.parseFloat(cs.paddingBottom) || 0,
		left: Number.parseFloat(cs.paddingLeft) || 0
	};
}

/** Layout height for the app shell — prefer `innerHeight` (stable). */
export function layoutViewportHeight(): number {
	const layoutH = window.innerHeight;
	const clientH = document.documentElement.clientHeight || 0;
	// Prefer the larger of the two common layout metrics; avoid visualViewport
	// here so keyboard pan cannot inflate or shrink the shell incorrectly.
	return Math.round(Math.max(layoutH, clientH));
}
