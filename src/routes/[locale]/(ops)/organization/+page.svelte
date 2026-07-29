<script lang="ts">
	import OrganizationClient from '$lib/components/organization/OrganizationClient.svelte';
	import type { PageProps } from './$types';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{brandedTitle(d.organization.title, data.documentBrand)}</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="w-full animate-fade-in-up">
		<OrganizationClient
			locale={data.locale}
			{d}
			organizationName={data.organizationName}
			planTier={data.planTier}
			hasStripeCustomer={data.hasStripeCustomer}
			subscriptionCancelAt={data.subscriptionCancelAt}
			subscriptionCancelAtPeriodEnd={data.subscriptionCancelAtPeriodEnd}
			billingFlash={data.billingFlash}
			stripePublishableKey={data.stripePublishableKey}
			gyms={data.gyms}
			feedback={data.feedback}
			activeGymName={data.activeGymName}
		/>
	</div>
{/if}
