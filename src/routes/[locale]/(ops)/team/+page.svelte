<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import type { PageProps } from './$types';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
	const locale = $derived(data.locale!);
	const invite = $derived(data.invite);

	const title = $derived(
		invite === 'trainer'
			? d.dashboard.quickNewTrainer
			: invite === 'staff'
				? d.dashboard.quickNewStaff
				: d.team.title
	);
</script>

<svelte:head>
	<title>{brandedTitle(title, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-6">
	<a
		href="/{locale}/dashboard"
		class="inline-flex min-h-11 w-fit items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
	>
		<ArrowLeft class="h-4 w-4" aria-hidden="true" />
		{d.dashboard.title}
	</a>

	<div
		class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sm:p-8"
	>
		<div
			class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
		>
			{#if invite === 'staff'}
				<Briefcase class="h-5 w-5" aria-hidden="true" />
			{:else}
				<Dumbbell class="h-5 w-5" aria-hidden="true" />
			{/if}
		</div>
		<h1 class="font-title text-2xl font-bold text-[var(--color-text)]">{title}</h1>
		<p class="mt-2 text-sm text-[var(--color-muted)]">{d.team.comingSoon}</p>
		<p class="mt-4 text-sm text-[var(--color-muted)]">{d.team.comingSoonHint}</p>
		<div class="mt-6 flex flex-wrap gap-3 text-sm">
			<a
				href="/{locale}/trainers"
				class="font-semibold text-[var(--color-primary)] hover:underline"
			>
				{d.trainers.title}
			</a>
			<a
				href="/{locale}/staff"
				class="font-semibold text-[var(--color-primary)] hover:underline"
			>
				{d.staffPage.title}
			</a>
		</div>
	</div>
</div>
