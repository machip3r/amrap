<script lang="ts">
	import OrganizationClient from '$lib/components/organization/OrganizationClient.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{d.organization.title} — AMRAP</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="mx-auto w-full max-w-6xl animate-fade-in-up">
		<OrganizationClient
			locale={data.locale}
			{d}
			organizationName={data.organizationName}
			planTier={data.planTier}
			gyms={data.gyms}
		/>
	</div>
{/if}
