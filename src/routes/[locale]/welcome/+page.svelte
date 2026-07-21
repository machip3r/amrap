<script lang="ts">
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import WelcomeProfileForm from '$lib/components/welcome/WelcomeProfileForm.svelte';
	import type { WelcomeActionState } from '$lib/server/welcome/actions';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.title} — AMRAP</title>
</svelte:head>

<div class="auth-container flex min-h-dvh flex-col items-center justify-center px-[var(--spacing-page)] py-4 sm:px-6 sm:py-6">
	<div class="glass-panel animate-fade-in-up flex w-full max-w-md flex-col rounded-2xl p-8 shadow-2xl sm:p-10">
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="mb-5 flex w-full justify-center">
				<a href="/{data.locale}" aria-label="AMRAP">
					<AmrapLogo class="h-12 w-auto sm:h-14" />
				</a>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)]">{data.title}</h1>
			<p class="mt-2 text-sm text-[var(--color-muted)]">{data.subtitle}</p>
		</div>

		<WelcomeProfileForm
			locale={data.locale}
			d={data.d}
			role={data.role}
			defaultDateOfBirth={data.defaultDateOfBirth}
			defaultSex={data.defaultSex}
			defaultHeightCm={data.defaultHeightCm}
			defaultWeightKg={data.defaultWeightKg}
			form={(form as WelcomeActionState) ?? null}
		/>

		<div class="mt-8 border-t border-[var(--color-border)] pt-5 text-center">
			<LogoutButton
				locale={data.locale}
				pendingLabel={data.d.nav.loggingOut}
				class="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				{data.d.nav.logout}
			</LogoutButton>
		</div>
	</div>
</div>
