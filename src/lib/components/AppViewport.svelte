<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { layoutViewportHeight } from '$lib/dom/safe-area';

	/**
	 * Keeps `--app-height` in sync with the layout viewport.
	 *
	 * Do not shrink to `visualViewport.height` while the keyboard is open —
	 * iOS pans `visualViewport.offsetTop` and a short shell leaves a giant
	 * empty/white gap below the app (timer editor, dialogs, etc.).
	 *
	 * After keyboard dismiss, reset scroll so a stuck offset cannot linger.
	 */
	onMount(() => {
		if (!browser) return;

		// Dismiss inline app.html splash once the shell is alive.
		const boot = document.getElementById('amrap-boot');
		let bootTimer: ReturnType<typeof setTimeout> | undefined;
		if (boot) {
			boot.setAttribute('data-done', '');
			bootTimer = window.setTimeout(() => boot.remove(), 320);
		}

		const root = document.documentElement;
		let keyboardWasOpen = false;

		function measure() {
			const h = layoutViewportHeight();
			root.style.setProperty('--app-height', `${h}px`);
		}

		function keyboardOpenNow() {
			const vv = window.visualViewport;
			if (!vv) return false;
			return window.innerHeight - vv.height > 40;
		}

		function syncHeight() {
			measure();
			if (keyboardOpenNow()) keyboardWasOpen = true;
		}

		/** After keyboard / external return — recover stuck scroll offset. */
		function recoverScrollIfNeeded() {
			const open = keyboardOpenNow();
			measure();
			if (open) {
				keyboardWasOpen = true;
				// Keep layout pinned while the keyboard is up.
				if (window.scrollY !== 0) window.scrollTo(0, 0);
				return;
			}
			if (!keyboardWasOpen) return;
			keyboardWasOpen = false;

			const vv = window.visualViewport;
			if (window.scrollY !== 0 || (vv && vv.offsetTop !== 0)) {
				window.scrollTo(0, 0);
			}
			requestAnimationFrame(() => {
				measure();
				requestAnimationFrame(measure);
			});
		}

		syncHeight();

		const vv = window.visualViewport;
		vv?.addEventListener('resize', syncHeight);
		vv?.addEventListener('scroll', onVisualScroll);
		window.addEventListener('resize', syncHeight);
		window.addEventListener('orientationchange', recoverScrollIfNeeded);
		window.addEventListener('focusin', onFocusIn);
		window.addEventListener('focusout', onFocusOut);
		document.addEventListener('visibilitychange', syncHeight);
		window.addEventListener('pageshow', recoverScrollIfNeeded);
		document.addEventListener('gesturestart', preventGesture, { passive: false });
		document.addEventListener('gesturechange', preventGesture, { passive: false });

		let focusOutTimer: ReturnType<typeof setTimeout> | undefined;

		function onFocusIn() {
			measure();
			// Only pin when the soft keyboard is open. Unconditional scrollTo(0)
			// jumps the landing page (and any scrolled surface) when a dialog
			// autofocuses — compare plans needed a second click after the jump.
			if (!keyboardOpenNow()) return;
			keyboardWasOpen = true;
			if (window.scrollY !== 0) window.scrollTo(0, 0);
		}

		function onFocusOut() {
			clearTimeout(focusOutTimer);
			focusOutTimer = setTimeout(recoverScrollIfNeeded, 100);
		}

		function onVisualScroll() {
			// While keyboard is open, iOS may pan the visual viewport — pin window scroll.
			if (keyboardOpenNow() && window.scrollY !== 0) {
				window.scrollTo(0, 0);
			}
			syncHeight();
		}

		function preventGesture(e: Event) {
			e.preventDefault();
		}

		return () => {
			clearTimeout(bootTimer);
			clearTimeout(focusOutTimer);
			vv?.removeEventListener('resize', syncHeight);
			vv?.removeEventListener('scroll', onVisualScroll);
			window.removeEventListener('resize', syncHeight);
			window.removeEventListener('orientationchange', recoverScrollIfNeeded);
			window.removeEventListener('focusin', onFocusIn);
			window.removeEventListener('focusout', onFocusOut);
			document.removeEventListener('visibilitychange', syncHeight);
			window.removeEventListener('pageshow', recoverScrollIfNeeded);
			document.removeEventListener('gesturestart', preventGesture);
			document.removeEventListener('gesturechange', preventGesture);
		};
	});
</script>
