<script lang="ts">
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import OnboardingStepper from '$lib/components/onboarding/OnboardingStepper.svelte';
	import type { OnboardingActionState } from '$lib/server/onboarding/actions';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.d.onboarding.title} — AMRAP</title>
</svelte:head>

{#if data.orgError}
	<div class="auth-container flex min-h-dvh flex-col items-center justify-center px-[var(--spacing-page)] py-4 sm:px-6 sm:py-6">
		<div class="glass-panel flex w-full max-w-md flex-col items-center rounded-2xl p-8 text-center shadow-2xl sm:p-10">
			<AmrapLogo class="mb-6 h-12 w-auto" />
			<h1 class="text-xl font-bold text-[var(--color-text)]">{data.d.onboarding.title}</h1>
			<p class="mt-3 text-sm text-[var(--color-primary)]" role="alert">{data.d.onboarding.errorSave}</p>
			<a
				href="/auth/ensure-organization?locale={data.locale}"
				class="mt-6 text-sm font-semibold text-[var(--color-primary)] underline"
			>
				{data.d.common.back}
			</a>
			<LogoutButton
				locale={data.locale}
				pendingLabel={data.d.nav.loggingOut}
				class="mt-4 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				{data.d.nav.logout}
			</LogoutButton>
		</div>
	</div>
{:else}
	<div
		class="auth-container flex min-h-dvh flex-col items-center justify-center px-[var(--spacing-page)] py-3 sm:px-6 sm:py-6"
	>
		<div
			class="glass-panel animate-fade-in-up flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl p-6 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:max-w-xl sm:p-10"
		>
			<div class="mb-6 flex shrink-0 flex-col items-center text-center sm:mb-8">
				<div class="mb-5 flex w-full justify-center">
					<a href="/{data.locale}" aria-label="AMRAP">
						<AmrapLogo class="h-12 w-auto sm:h-14" />
					</a>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)]">
					{data.d.onboarding.title}
				</h1>
				<p class="mt-2 text-sm text-[var(--color-muted)]">{data.d.onboarding.subtitle}</p>
			</div>

			<OnboardingStepper
				locale={data.locale}
				onboardingState={data.state}
				plans={data.plans}
				dayPassPrice={data.dayPassPrice}
				planTier={data.planTier}
				planCap={data.planCap}
				stripePublishableKey={data.stripePublishableKey}
				billingFlash={data.billingFlash}
				showError={data.showError}
				form={(form as OnboardingActionState) ?? null}
			/>
		</div>
	</div>
{/if}
