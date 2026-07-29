<script lang="ts">
	// import NavCustomizationForm from '$lib/components/settings/NavCustomizationForm.svelte';
	import OnlineBillingSettings from '$lib/components/settings/OnlineBillingSettings.svelte';
	import PersonalizationForm from '$lib/components/settings/PersonalizationForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { OWNER_TOUR_STORAGE_KEY } from '$lib/tour/constants';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const d = $derived(data.d!);

	let replayOpen = $state(false);

	function replayTour() {
		try {
			localStorage.removeItem(OWNER_TOUR_STORAGE_KEY);
		} catch {
			/* ignore */
		}
		window.location.href = `/${data.locale}/dashboard?tour=1`;
	}

	const gatewayForm = $derived(
		form && ('syncedCount' in form || form.error || form.success)
			? { error: form.error, success: form.success }
			: null
	);
</script>

<svelte:head>
	<title>{brandedTitle(d.settings.title, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-8">
	<header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
		<div class="min-w-0">
			<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
				{d.settings.title}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				{data.canManageGymBrand ? d.settings.subtitle : d.settings.limitedSubtitle}
			</p>
		</div>
		{#if data.canActAsOwner}
			<Button
				type="button"
				variant="toolbarSecondary"
				class="shrink-0 self-end sm:self-start"
				onclick={() => (replayOpen = true)}
			>
				{d.tour.replay}
			</Button>
		{/if}
	</header>

	{#if data.canManageGymBrand}
		<OnlineBillingSettings
			locale={data.locale}
			{d}
			canManage={data.canManageGymBrand}
			canUseOnlineBilling={data.canUseOnlineBilling}
			mpConfigured={data.mpConfigured}
			account={data.gatewayAccount}
			flash={data.gatewayFlash}
			form={gatewayForm}
		/>
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

{#if data.canActAsOwner}
	<Dialog
		open={replayOpen}
		onOpenChange={(open) => (replayOpen = open)}
		title={d.tour.replayConfirmTitle}
		description={d.tour.replayConfirmBody}
		closeLabel={d.organization.close}
		class="max-w-md"
		autoFocus={false}
	>
		<div class="flex w-full justify-end">
			<Button type="button" class="w-full sm:w-auto" onclick={replayTour}>
				{d.tour.replayConfirm}
			</Button>
		</div>
	</Dialog>
{/if}
