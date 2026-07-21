<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';

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
		containerClass = 'items-end justify-center p-3 sm:items-center sm:p-6',
		bodyClass = 'px-6 py-5',
		autoFocus = true,
		fullScreen = false,
		children
	}: Props = $props();

	const titleId = `dialog-title-${Math.random().toString(36).slice(2, 9)}`;
	const descId = `${titleId}-desc`;
	let panelEl: HTMLDivElement | undefined = $state();

	/** Move overlay to `document.body` so `fixed` is not trapped by animated/transformed ancestors. */
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

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
			? 'h-dvh max-h-dvh w-full rounded-none border-0 shadow-none'
			: 'max-h-[min(96dvh,64rem)] w-full rounded-2xl border border-[var(--color-border)] shadow-2xl'
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
				class="absolute inset-0 bg-[var(--color-text)]/40 backdrop-blur-[2px] transition-opacity"
				aria-label={closeLabel}
				onclick={() => onOpenChange(false)}
			></button>
		{/if}
		<div
			bind:this={panelEl}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={description ? descId : undefined}
			class="animate-fade-in-up relative z-10 flex flex-col overflow-hidden bg-[var(--color-surface)] {panelSize} {panelClassName}"
		>
			<div
				class="relative shrink-0 border-b border-[var(--color-border)] px-6 pb-4 pr-14 {fullScreen
					? 'pt-[max(1.25rem,var(--safe-top))]'
					: 'pt-6'}"
			>
				<h2
					id={titleId}
					class="font-title text-xl font-bold tracking-tight text-[var(--color-text)] sm:text-2xl"
				>
					{title}
				</h2>
				{#if description}
					<p id={descId} class="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
						{description}
					</p>
				{/if}
				<button
					type="button"
					data-dialog-close
					onclick={() => onOpenChange(false)}
					class="absolute right-4 top-[max(0.75rem,var(--safe-top))] flex h-[var(--touch-target)] w-[var(--touch-target)] items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
					aria-label={closeLabel}
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</button>
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto {bodyClass}">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
