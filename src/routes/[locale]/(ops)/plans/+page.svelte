<script lang="ts">
	import PlansClient from '$lib/components/plans/PlansClient.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{d.plans.title} — AMRAP</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="flex w-full animate-fade-in-up flex-col gap-5">
		{#if data.errorKey === 'limit'}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{d.plans.planLimit}
			</p>
		{:else if data.errorKey === 'generic'}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{d.plans.error}
			</p>
		{/if}

		<PlansClient
			locale={data.locale}
			{d}
			plans={data.plans}
			canAdd={data.canAdd}
			activeCount={data.activeCount}
			maxPlans={data.maxPlans}
			dayPassPrice={data.dayPassPrice}
		/>
	</div>
{/if}
