<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { portal } from '$lib/dom/portal';
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
		containerClass = 'items-center justify-center p-3 sm:p-6',
		bodyClass = 'px-6 py-5',
		autoFocus = true,
		fullScreen = false,
		children
	}: Props = $props();

	const titleId = `dialog-title-${Math.random().toString(36).slice(2, 9)}`;
	const descId = `${titleId}-desc`;
	let panelEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!open) return;

		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onOpenChange(false);
		};
		window.addEventListener('keydown', onKey);

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
			document.body.style.overflow = prevOverflow;
			window.removeEventListener('keydown', onKey);
		};
	});

	const panelClassName = $derived(className ?? (fullScreen ? '' : 'max-w-md'));
	const panelSize = $derived(
		fullScreen
			? 'h-[var(--app-height,100dvh)] max-h-[var(--app-height,100dvh)] w-full rounded-none border-0 shadow-none'
			: 'max-h-[min(calc(var(--app-height,100dvh)-1.5rem),64rem)] w-full rounded-2xl border border-[var(--color-border)] shadow-2xl'
	);
</script>

{#if open}
	<div
		use:portal
		class="fixed inset-0 z-50 flex {fullScreen
			? 'items-stretch justify-stretch p-0'
			: containerClass}"
	>
		{#if !fullScreen}
			<button
				type="button"
				class="absolute inset-0 bg-[var(--color-text)]/40 backdrop-blur-[2px]"
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
			class="relative z-10 flex flex-col overflow-hidden bg-[var(--color-surface)] {panelSize} {panelClassName}"
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
			<div class="min-h-0 flex-1 overflow-y-auto {bodyClass}">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
