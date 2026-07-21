<script lang="ts">
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';
	import InvitePasswordForm from '$lib/components/invite/InvitePasswordForm.svelte';
	import LogoutButton from '$lib/components/LogoutButton.svelte';
	import type { InvitePasswordState } from '$lib/server/invite/actions';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.d.invite.passwordTitle} — AMRAP</title>
</svelte:head>

<div class="auth-container flex min-h-dvh flex-col items-center justify-center px-[var(--spacing-page)] py-4 sm:px-6 sm:py-6">
	<div class="glass-panel animate-fade-in-up flex w-full max-w-md flex-col rounded-2xl p-8 shadow-2xl sm:p-10">
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="mb-5 flex w-full justify-center">
				<a href="/{data.locale}" aria-label="AMRAP">
					<AmrapLogo class="h-12 w-auto sm:h-14" />
				</a>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)]">
				{data.d.invite.passwordTitle}
			</h1>
			<p class="mt-2 text-sm text-[var(--color-muted)]">{data.d.invite.passwordSubtitle}</p>
		</div>

		<InvitePasswordForm locale={data.locale} d={data.d} form={(form as InvitePasswordState) ?? null} />

		<div class="mt-8 border-t border-[var(--color-border)] pt-5 text-center">
			<LogoutButton
				locale={data.locale}
				class="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				{data.d.nav.logout}
			</LogoutButton>
		</div>
	</div>
</div>
