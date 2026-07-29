import { layoutViewportHeight } from '$lib/dom/safe-area';

/**
 * Lock document scroll while a modal is open.
 * Uses `position: fixed` so iOS Safari / PWA cannot scroll the page behind
 * when the soft keyboard opens (plain `overflow: hidden` is not enough).
 *
 * When already at scroll 0 (ops/member shells), pin body with inset so iOS
 * cannot leave a strip under a content-sized fixed body.
 */
export function lockBodyScroll(): () => void {
	const html = document.documentElement;
	const body = document.body;
	const scrollY = window.scrollY || html.scrollTop || 0;

	const prev = {
		htmlOverflow: html.style.overflow,
		htmlOverscroll: html.style.overscrollBehavior,
		htmlHeight: html.style.height,
		bodyOverflow: body.style.overflow,
		bodyPosition: body.style.position,
		bodyTop: body.style.top,
		bodyLeft: body.style.left,
		bodyRight: body.style.right,
		bodyBottom: body.style.bottom,
		bodyWidth: body.style.width,
		bodyHeight: body.style.height,
		bodyMinHeight: body.style.minHeight,
		bodyPaddingRight: body.style.paddingRight,
		bodyOverscroll: body.style.overscrollBehavior
	};

	const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);
	const coverH = `${layoutViewportHeight()}px`;

	html.style.overflow = 'hidden';
	html.style.overscrollBehavior = 'none';
	html.style.height = coverH;
	body.style.overflow = 'hidden';
	body.style.overscrollBehavior = 'none';
	body.style.position = 'fixed';
	body.style.left = '0';
	body.style.right = '0';
	body.style.width = '100%';
	body.style.minHeight = coverH;
	if (scrollY === 0) {
		body.style.top = '0';
		body.style.bottom = '0';
		body.style.height = coverH;
	} else {
		body.style.top = `-${scrollY}px`;
		body.style.bottom = '';
		body.style.height = '';
	}
	if (scrollbarGap > 0) {
		body.style.paddingRight = `${scrollbarGap}px`;
	}

	return () => {
		html.style.overflow = prev.htmlOverflow;
		html.style.overscrollBehavior = prev.htmlOverscroll;
		html.style.height = prev.htmlHeight;
		body.style.overflow = prev.bodyOverflow;
		body.style.position = prev.bodyPosition;
		body.style.top = prev.bodyTop;
		body.style.left = prev.bodyLeft;
		body.style.right = prev.bodyRight;
		body.style.bottom = prev.bodyBottom;
		body.style.width = prev.bodyWidth;
		body.style.height = prev.bodyHeight;
		body.style.minHeight = prev.bodyMinHeight;
		body.style.paddingRight = prev.bodyPaddingRight;
		body.style.overscrollBehavior = prev.bodyOverscroll;
		window.scrollTo(0, scrollY);
	};
}
