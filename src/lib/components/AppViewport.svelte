<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	/**
	 * Keeps `--app-height` in sync with the visible viewport.
	 * iOS PWA/Safari often leaves a permanent bottom gap after the keyboard
	 * (or an external Stripe redirect) if the shell only uses `100dvh`.
	 *
	 * Scroll reset runs only after keyboard dismiss / pageshow — never on
	 * every visualViewport scroll (that fights the iOS back-swipe gesture).
	 */
	onMount(() => {
		if (!browser) return;

		const root = document.documentElement;
		let keyboardWasOpen = false;

		function measure() {
			const vv = window.visualViewport;
			const layoutH = window.innerHeight;
			const visualH = vv?.height ?? layoutH;
			const keyboardOpen = vv != null && layoutH - visualH > 40;
			const h = Math.round(keyboardOpen ? visualH : layoutH);
			root.style.setProperty('--app-height', `${h}px`);
			return keyboardOpen;
		}

		function syncHeight() {
			const keyboardOpen = measure();
			if (keyboardOpen) keyboardWasOpen = true;
		}

		/** After keyboard / external return — recover stuck scroll offset. */
		function recoverScrollIfNeeded() {
			const keyboardOpen = measure();
			if (keyboardOpen) {
				keyboardWasOpen = true;
				return;
			}
			if (!keyboardWasOpen) return;
			keyboardWasOpen = false;

			const vv = window.visualViewport;
			if (window.scrollY !== 0 || (vv && vv.offsetTop !== 0)) {
				window.scrollTo(0, 0);
			}
		}

		syncHeight();

		const vv = window.visualViewport;
		vv?.addEventListener('resize', syncHeight);
		vv?.addEventListener('scroll', syncHeight);
		window.addEventListener('resize', syncHeight);
		window.addEventListener('orientationchange', recoverScrollIfNeeded);
		window.addEventListener('focusin', syncHeight);
		window.addEventListener('focusout', onFocusOut);
		document.addEventListener('visibilitychange', syncHeight);
		window.addEventListener('pageshow', recoverScrollIfNeeded);
		// iOS Safari / PWA: block pinch-zoom gestures that break the app shell layout
		document.addEventListener('gesturestart', preventGesture, { passive: false });
		document.addEventListener('gesturechange', preventGesture, { passive: false });

		let focusOutTimer: ReturnType<typeof setTimeout> | undefined;
		function onFocusOut() {
			clearTimeout(focusOutTimer);
			// iOS fires focusout before the keyboard finishes closing.
			focusOutTimer = setTimeout(recoverScrollIfNeeded, 100);
		}

		function preventGesture(e: Event) {
			e.preventDefault();
		}

		return () => {
			clearTimeout(focusOutTimer);
			vv?.removeEventListener('resize', syncHeight);
			vv?.removeEventListener('scroll', syncHeight);
			window.removeEventListener('resize', syncHeight);
			window.removeEventListener('orientationchange', recoverScrollIfNeeded);
			window.removeEventListener('focusin', syncHeight);
			window.removeEventListener('focusout', onFocusOut);
			document.removeEventListener('visibilitychange', syncHeight);
			window.removeEventListener('pageshow', recoverScrollIfNeeded);
			document.removeEventListener('gesturestart', preventGesture);
			document.removeEventListener('gesturechange', preventGesture);
		};
	});
</script>
