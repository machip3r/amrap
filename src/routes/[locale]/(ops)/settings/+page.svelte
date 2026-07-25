<script lang="ts">
	// import NavCustomizationForm from '$lib/components/settings/NavCustomizationForm.svelte';
	import PersonalizationForm from '$lib/components/settings/PersonalizationForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { OWNER_TOUR_STORAGE_KEY } from '$lib/tour/constants';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);

	function replayTour() {
		try {
			localStorage.removeItem(OWNER_TOUR_STORAGE_KEY);
		} catch {
			/* ignore */
		}
		window.location.href = `/${data.locale}/dashboard?tour=1`;
	}
</script>

<svelte:head>
	<title>{brandedTitle(d.settings.title, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-8">
	<header>
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{d.settings.title}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">
			{data.canManageGymBrand ? d.settings.subtitle : d.settings.limitedSubtitle}
		</p>
	</header>

	{#if data.canActAsOwner}
		<section
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{d.tour.replay}</h2>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{d.tour.stepDashboardBody}</p>
			<Button type="button" variant="toolbar" class="mt-4" onclick={replayTour}>
				{d.tour.replay}
			</Button>
		</section>
	{/if}

	<!-- My menu (nav visibility) — temporarily disabled
	<NavCustomizationForm
		locale={data.locale}
		{d}
		role={data.navRole}
		canManageSettings={data.canManageGymBrand}
		canManageStaff={data.canManageStaff}
		hiddenNavIds={data.hiddenNavIds}
	/>
	-->

	{#if data.canManageGymBrand}
		<PersonalizationForm
			locale={data.locale}
			{d}
			logoUrlLight={data.logoUrlLight}
			logoUrlDark={data.logoUrlDark}
			canCustomizeBrand={data.canCustomizeBrand}
			canUseCustomDomain={data.canUseCustomDomain}
		/>
	{/if}
</div>
