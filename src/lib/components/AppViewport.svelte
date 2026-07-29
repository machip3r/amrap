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

		const root = document.documentElement;
		let keyboardWasOpen = false;
		const pendingTimers: number[] = [];

		function measure() {
			const h = layoutViewportHeight();
			root.style.setProperty('--app-height', `${h}px`);
		}

		function pinDocumentScroll() {
			window.scrollTo(0, 0);
			root.scrollTop = 0;
			document.body.scrollTop = 0;
		}

		function afterBootSettle(fn: () => void, ms: number) {
			pendingTimers.push(window.setTimeout(fn, ms));
		}

		/**
		 * Remove splash without toggling document overflow (that unlock is what
		 * left a white strip under the bottom nav on iOS PWA).
		 */
		function dismissBootSplash() {
			const boot = document.getElementById('amrap-boot');
			root.classList.remove('amrap-booting');
			pinDocumentScroll();
			measure();

			if (!boot) return;

			// Remove immediately — no fade that leaves the page interactive underneath
			// while iOS still thinks the viewport is “boot-sized”.
			boot.remove();
			pinDocumentScroll();
			measure();

			// iOS often reports the real height a beat after the overlay is gone.
			requestAnimationFrame(() => {
				pinDocumentScroll();
				measure();
				afterBootSettle(() => {
					pinDocumentScroll();
					measure();
				}, 100);
				afterBootSettle(() => {
					pinDocumentScroll();
					measure();
				}, 400);
			});
		}

		dismissBootSplash();

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
		window.addEventListener('pageshow', onPageShow);
		document.addEventListener('gesturestart', preventGesture, { passive: false });
		document.addEventListener('gesturechange', preventGesture, { passive: false });

		let focusOutTimer: ReturnType<typeof setTimeout> | undefined;

		function onPageShow() {
			pinDocumentScroll();
			measure();
			recoverScrollIfNeeded();
		}

		function onFocusIn() {
			measure();
			if (!keyboardOpenNow()) return;
			keyboardWasOpen = true;
			if (window.scrollY !== 0) window.scrollTo(0, 0);
		}

		function onFocusOut() {
			clearTimeout(focusOutTimer);
			focusOutTimer = setTimeout(recoverScrollIfNeeded, 100);
		}

		function onVisualScroll() {
			if (keyboardOpenNow() && window.scrollY !== 0) {
				window.scrollTo(0, 0);
			}
			syncHeight();
		}

		function preventGesture(e: Event) {
			e.preventDefault();
		}

		return () => {
			for (const t of pendingTimers) clearTimeout(t);
			root.classList.remove('amrap-booting');
			clearTimeout(focusOutTimer);
			vv?.removeEventListener('resize', syncHeight);
			vv?.removeEventListener('scroll', onVisualScroll);
			window.removeEventListener('resize', syncHeight);
			window.removeEventListener('orientationchange', recoverScrollIfNeeded);
			window.removeEventListener('focusin', onFocusIn);
			window.removeEventListener('focusout', onFocusOut);
			document.removeEventListener('visibilitychange', syncHeight);
			window.removeEventListener('pageshow', onPageShow);
			document.removeEventListener('gesturestart', preventGesture);
			document.removeEventListener('gesturechange', preventGesture);
		};
	});
</script>
