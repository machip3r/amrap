<script lang="ts">
	import type { Component } from 'svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import SearchX from '@lucide/svelte/icons/search-x';
	import { buttonVariants } from '$lib/components/ui/button-variants';

	type Props = {
		title: string;
		description: string;
		backHref: string;
		backLabel: string;
		/** Optional secondary link (e.g. dashboard). */
		homeHref?: string;
		homeLabel?: string;
		icon?: Component;
		class?: string;
	};

	let {
		title,
		description,
		backHref,
		backLabel,
		homeHref = undefined,
		homeLabel = undefined,
		icon: Icon = SearchX,
		class: className = ''
	}: Props = $props();
</script>

<div
	class="mx-auto flex w-full max-w-lg flex-col items-center px-2 py-10 text-center sm:py-14 {className}"
	role="status"
>
	<div class="relative mb-6 flex h-28 w-28 items-center justify-center" aria-hidden="true">
		<span
			class="absolute inset-0 rounded-[2rem] bg-[var(--color-primary)]/10 motion-safe:animate-pulse"
		></span>
		<span
			class="absolute inset-3 rounded-[1.5rem] border border-dashed border-[var(--color-primary)]/35 bg-[var(--color-surface)]"
		></span>
		<span
			class="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-sm"
		>
			<Icon class="h-7 w-7" strokeWidth={2} />
		</span>
	</div>

	<p class="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
		404
	</p>
	<h1 class="font-title text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
		{title}
	</h1>
	<p class="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
		{description}
	</p>

	<div class="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
		<a href={backHref} class="{buttonVariants.primary} w-full min-w-[12rem] gap-2 sm:w-auto">
			<ArrowLeft class="h-4 w-4 shrink-0" aria-hidden="true" />
			{backLabel}
		</a>
		{#if homeHref && homeLabel}
			<a
				href={homeHref}
				class="inline-flex min-h-[var(--touch-target)] items-center justify-center rounded-lg px-4 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				{homeLabel}
			</a>
		{/if}
	</div>
</div>
