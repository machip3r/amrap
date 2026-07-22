<script lang="ts">
	import AuthBrandPanel from '$lib/components/auth/AuthBrandPanel.svelte';
	import InviteDecideForm from '$lib/components/invite/InviteDecideForm.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { InviteDecideState } from '$lib/server/invite/actions';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{brandedTitle(data.headline, data.brand?.documentBrand)}</title>
</svelte:head>

<AuthBrandPanel
	locale={data.locale}
	brand={data.brand}
	title={data.headline}
	subtitle={data.body}
>
	<InviteDecideForm locale={data.locale} d={data.d} form={(form as InviteDecideState) ?? null} />

	{#snippet footer()}
		{#if data.hasSession}
			<LogoutButton
				locale={data.locale}
				pendingLabel={data.d.nav.loggingOut}
				class="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				{data.d.nav.logout}
			</LogoutButton>
		{/if}
	{/snippet}
</AuthBrandPanel>
