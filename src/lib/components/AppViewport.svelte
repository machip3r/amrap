<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	/**
	 * Keeps `--app-height` in sync with the visible viewport.
	 * iOS PWA/Safari often leaves a permanent bottom gap after the keyboard
	 * (or an external Stripe redirect) if the shell only uses `100dvh`.
	 */
	onMount(() => {
		if (!browser) return;

		const root = document.documentElement;

		function sync() {
			const vv = window.visualViewport;
			const layoutH = window.innerHeight;
			const visualH = vv?.height ?? layoutH;
			// Keyboard open: visual is clearly shorter. Otherwise prefer layout height
			// so we recover after dismiss / checkout return.
			const keyboardOpen = vv != null && layoutH - visualH > 40;
			const h = Math.round(keyboardOpen ? visualH : layoutH);
			root.style.setProperty('--app-height', `${h}px`);

			if (!keyboardOpen && (window.scrollY !== 0 || (vv && vv.offsetTop !== 0))) {
				window.scrollTo(0, 0);
			}
		}

		sync();

		const vv = window.visualViewport;
		vv?.addEventListener('resize', sync);
		vv?.addEventListener('scroll', sync);
		window.addEventListener('resize', sync);
		window.addEventListener('orientationchange', sync);
		window.addEventListener('focusin', sync);
		window.addEventListener('focusout', onFocusOut);
		document.addEventListener('visibilitychange', sync);
		window.addEventListener('pageshow', sync);

		let focusOutTimer: ReturnType<typeof setTimeout> | undefined;
		function onFocusOut() {
			clearTimeout(focusOutTimer);
			// iOS fires focusout before the keyboard finishes closing.
			focusOutTimer = setTimeout(sync, 100);
		}

		return () => {
			clearTimeout(focusOutTimer);
			vv?.removeEventListener('resize', sync);
			vv?.removeEventListener('scroll', sync);
			window.removeEventListener('resize', sync);
			window.removeEventListener('orientationchange', sync);
			window.removeEventListener('focusin', sync);
			window.removeEventListener('focusout', onFocusOut);
			document.removeEventListener('visibilitychange', sync);
			window.removeEventListener('pageshow', sync);
		};
	});
</script>
