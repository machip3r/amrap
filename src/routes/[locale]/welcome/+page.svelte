<script lang="ts">
	import AuthBrandPanel from '$lib/components/auth/AuthBrandPanel.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import WelcomeProfileForm from '$lib/components/welcome/WelcomeProfileForm.svelte';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { WelcomeActionState } from '$lib/server/welcome/actions';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{brandedTitle(data.title, data.brand?.documentBrand)}</title>
</svelte:head>

<AuthBrandPanel locale={data.locale} brand={data.brand} title={data.title} subtitle={data.subtitle}>
	<WelcomeProfileForm
		locale={data.locale}
		d={data.d}
		role={data.role}
		defaultDateOfBirth={data.defaultDateOfBirth}
		defaultGender={data.defaultGender}
		defaultHeightCm={data.defaultHeightCm}
		defaultWeightKg={data.defaultWeightKg}
		form={(form as WelcomeActionState) ?? null}
	/>

	{#snippet footer()}
		<LogoutButton
			locale={data.locale}
			pendingLabel={data.d.nav.loggingOut}
			class="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
		>
			{data.d.nav.logout}
		</LogoutButton>
	{/snippet}
</AuthBrandPanel>
