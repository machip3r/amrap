<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { portal } from '$lib/dom/portal';
	import { lockBodyScroll } from '$lib/dom/scroll-lock';
	import { uiFade, uiFly } from '$lib/motion';

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		title: string;
		description?: string;
		closeLabel: string;
		class?: string;
		containerClass?: string;
		bodyClass?: string;
		autoFocus?: boolean;
		fullScreen?: boolean;
		children: Snippet;
	};

	let {
		open,
		onOpenChange,
		title,
		description = undefined,
		closeLabel,
		class: className = undefined,
		containerClass = 'items-start justify-center p-3 pt-[max(0.75rem,var(--safe-top))] sm:items-center sm:p-6 sm:pt-6',
		bodyClass = 'px-6 py-5',
		autoFocus = true,
		fullScreen = false,
		children
	}: Props = $props();

	const titleId = `dialog-title-${Math.random().toString(36).slice(2, 9)}`;
	const descId = `${titleId}-desc`;
	let panelEl: HTMLDivElement | undefined = $state();
	let overlayEl: HTMLDivElement | undefined = $state();
	let bodyScrollEl: HTMLDivElement | undefined = $state();

	/** Pin the overlay to the visual viewport so iOS keyboard resize doesn't expose the app chrome. */
	function syncOverlayToVisualViewport() {
		const el = overlayEl;
		if (!el) return;
		const vv = window.visualViewport;
		if (!vv) {
			el.style.top = '0';
			el.style.left = '0';
			el.style.width = '100%';
			el.style.height = 'var(--app-height, 100dvh)';
			return;
		}
		el.style.top = `${vv.offsetTop}px`;
		el.style.left = `${vv.offsetLeft}px`;
		el.style.width = `${vv.width}px`;
		el.style.height = `${vv.height}px`;
	}

	$effect(() => {
		if (!open) return;

		const unlock = lockBodyScroll();

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onOpenChange(false);
		};
		window.addEventListener('keydown', onKey);

		syncOverlayToVisualViewport();
		const vv = window.visualViewport;
		vv?.addEventListener('resize', syncOverlayToVisualViewport);
		vv?.addEventListener('scroll', syncOverlayToVisualViewport);
		window.addEventListener('resize', syncOverlayToVisualViewport);

		/**
		 * Block touch scroll chaining to the document. Allow pan only inside
		 * the dialog body (and portaled lists like PhoneInput country picker).
		 */
		function allowsTouchScroll(target: Node): HTMLElement | null {
			if (bodyScrollEl?.contains(target)) return bodyScrollEl;
			if (target instanceof Element) {
				const portaled = target.closest(
					'[role="listbox"], [role="menu"], [data-dialog-scroll]'
				);
				if (portaled instanceof HTMLElement) return portaled;
			}
			return null;
		}

		function onTouchMove(e: TouchEvent) {
			const target = e.target;
			if (!(target instanceof Node)) {
				e.preventDefault();
				return;
			}
			const scroller = allowsTouchScroll(target);
			if (!scroller) {
				e.preventDefault();
				return;
			}
			const canScroll = scroller.scrollHeight > scroller.clientHeight + 1;
			if (!canScroll) {
				e.preventDefault();
				return;
			}
			// At edges, prevent bounce from scrolling the page behind.
			const atTop = scroller.scrollTop <= 0;
			const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
			const touch = e.touches[0];
			const prevY = (scroller as HTMLElement & { __dialogTouchY?: number }).__dialogTouchY;
			if (touch && prevY != null) {
				const dy = touch.clientY - prevY;
				if ((atTop && dy > 0) || (atBottom && dy < 0)) {
					e.preventDefault();
				}
			}
			if (touch) {
				(scroller as HTMLElement & { __dialogTouchY?: number }).__dialogTouchY = touch.clientY;
			}
		}

		function onTouchStart(e: TouchEvent) {
			const target = e.target;
			const touch = e.touches[0];
			if (!(target instanceof Node) || !touch) return;
			const scroller = allowsTouchScroll(target);
			if (scroller) {
				(scroller as HTMLElement & { __dialogTouchY?: number }).__dialogTouchY = touch.clientY;
			}
		}

		document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
		document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });

		if (autoFocus) {
			queueMicrotask(() => {
				const panel = panelEl;
				const focusTarget =
					panel?.querySelector<HTMLElement>(
						'input:not([type="hidden"]):not([type="radio"]), textarea, select'
					) ??
					panel?.querySelector<HTMLElement>(
						'button:not([data-dialog-close]), [href], [tabindex]:not([tabindex="-1"])'
					);
				focusTarget?.focus();
			});
		}

		return () => {
			unlock();
			window.removeEventListener('keydown', onKey);
			vv?.removeEventListener('resize', syncOverlayToVisualViewport);
			vv?.removeEventListener('scroll', syncOverlayToVisualViewport);
			window.removeEventListener('resize', syncOverlayToVisualViewport);
			document.removeEventListener('touchstart', onTouchStart, true);
			document.removeEventListener('touchmove', onTouchMove, true);
		};
	});

	const panelClassName = $derived(className ?? (fullScreen ? '' : 'max-w-md'));
	const panelSize = $derived(
		fullScreen
			? 'h-full max-h-full w-full rounded-none border-0 shadow-none'
			: 'max-h-[min(100%,calc(100%-0.5rem))] w-full rounded-2xl border border-[var(--color-border)] shadow-2xl'
	);
</script>

{#if open}
	<div
		use:portal
		bind:this={overlayEl}
		class="fixed z-50 flex overscroll-none {fullScreen
			? 'items-stretch justify-stretch p-0'
			: containerClass}"
		style="top:0;left:0;width:100%;height:var(--app-height,100dvh)"
	>
		{#if !fullScreen}
			<button
				type="button"
				class="absolute inset-0 touch-none bg-[var(--color-text)]/40 backdrop-blur-[2px]"
				aria-label={closeLabel}
				onclick={() => onOpenChange(false)}
				transition:fade={uiFade(160)}
			></button>
		{/if}
		<div
			bind:this={panelEl}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={description ? descId : undefined}
			class="relative z-10 flex min-h-0 w-full flex-col overflow-hidden overscroll-contain bg-[var(--color-surface)] {panelSize} {panelClassName}"
			transition:fly={uiFly(fullScreen ? 220 : 280, fullScreen ? 12 : 18)}
		>
			<div
				class="shrink-0 border-b border-[var(--color-border)] px-6 pb-4 {fullScreen
					? 'pt-[max(1.25rem,var(--safe-top))]'
					: 'pt-5'}"
			>
				<div class="flex items-center gap-3">
					<h2
						id={titleId}
						class="min-w-0 flex-1 font-title text-xl font-bold tracking-tight text-[var(--color-text)] sm:text-2xl"
					>
						{title}
					</h2>
					<button
						type="button"
						data-dialog-close
						onclick={() => onOpenChange(false)}
						class="inline-flex h-[var(--touch-target)] w-[var(--touch-target)] shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
						aria-label={closeLabel}
					>
						<X class="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				{#if description}
					<p id={descId} class="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
						{description}
					</p>
				{/if}
			</div>
			<div
				bind:this={bodyScrollEl}
				data-dialog-scroll
				class="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] {bodyClass}"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}
