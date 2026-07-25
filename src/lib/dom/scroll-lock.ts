/**
 * Lock document scroll while a modal is open.
 * Uses `position: fixed` so iOS Safari / PWA cannot scroll the page behind
 * when the soft keyboard opens (plain `overflow: hidden` is not enough).
 */
export function lockBodyScroll(): () => void {
	const html = document.documentElement;
	const body = document.body;
	const scrollY = window.scrollY || html.scrollTop || 0;

	const prev = {
		htmlOverflow: html.style.overflow,
		bodyOverflow: body.style.overflow,
		bodyPosition: body.style.position,
		bodyTop: body.style.top,
		bodyLeft: body.style.left,
		bodyRight: body.style.right,
		bodyWidth: body.style.width,
		bodyPaddingRight: body.style.paddingRight
	};

	const scrollbarGap = Math.max(0, window.innerWidth - html.clientWidth);

	html.style.overflow = 'hidden';
	body.style.overflow = 'hidden';
	body.style.position = 'fixed';
	body.style.top = `-${scrollY}px`;
	body.style.left = '0';
	body.style.right = '0';
	body.style.width = '100%';
	if (scrollbarGap > 0) {
		body.style.paddingRight = `${scrollbarGap}px`;
	}

	return () => {
		html.style.overflow = prev.htmlOverflow;
		body.style.overflow = prev.bodyOverflow;
		body.style.position = prev.bodyPosition;
		body.style.top = prev.bodyTop;
		body.style.left = prev.bodyLeft;
		body.style.right = prev.bodyRight;
		body.style.width = prev.bodyWidth;
		body.style.paddingRight = prev.bodyPaddingRight;
		window.scrollTo(0, scrollY);
	};
}
