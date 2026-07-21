<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import AmrapWatermark from '$lib/components/AmrapWatermark.svelte';
	import ThemeToggle from '$lib/components/landing/ThemeToggle.svelte';
	import AppNav from '$lib/components/ops/AppNav.svelte';
	import OpsMobileNav from '$lib/components/ops/OpsMobileNav.svelte';
	import OpsNavLogo from '$lib/components/ops/OpsNavLogo.svelte';
	import OpsNavProgress from '$lib/components/ops/OpsNavProgress.svelte';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { getTimersImmersive } from '$lib/timers/shell.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		data: {
			locale: import('$lib/i18n/config').Locale;
			workspace: import('$lib/types').Workspace;
			initial: string;
			canManageSettings: boolean;
			canManageStaff: boolean;
			brandStyle: string;
			logoUrlLight: string | null;
			logoUrlDark: string | null;
			qrCode: string | null;
		};
		children: Snippet;
	};

	let { data, children }: Props = $props();
	const d = $derived(getDictionary(data.locale));
	/** Hide chrome without remounting page content (avoids resetting timer view state). */
	const immersiveTimers = $derived(getTimersImmersive());
</script>

<svelte:head>
	{@html `<style>${data.brandStyle}</style>`}
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<OpsNavProgress />

<div class="amrap-branded amrap-app-shell flex flex-col overflow-hidden bg-[var(--color-bg)]">
	<div class="flex min-h-0 flex-1 overflow-hidden">
		{#if !immersiveTimers}
			<AppNav
				locale={data.locale}
				role={data.workspace.role}
				canManageSettings={data.canManageSettings}
				canManageStaff={data.canManageStaff}
				hiddenNavIds={data.workspace.hiddenNavIds}
				logoUrlLight={data.logoUrlLight}
				logoUrlDark={data.logoUrlDark}
				gymName={data.workspace.gymName}
				organizationName={data.workspace.organizationName}
				isProvisionalOwner={data.workspace.isProvisionalOwner}
			/>
		{/if}
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			{#if !immersiveTimers}
				<header
					class="flex h-[calc(var(--ops-header-height)+var(--safe-top))] shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--spacing-page)] pt-[var(--safe-top)] sm:gap-3 sm:px-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)]"
				>
					<a
						href="/{data.locale}/dashboard"
						class="min-w-0 flex-1 md:hidden"
						aria-label={data.workspace.gymName || d.nav.dashboard}
					>
						<OpsNavLogo
							logoUrlLight={data.logoUrlLight}
							logoUrlDark={data.logoUrlDark}
							gymName={data.workspace.gymName}
							size="sm"
						/>
					</a>
					<div class="ml-auto flex items-center gap-2 sm:gap-3">
						<ThemeToggle
							label={d.a11y.toggleTheme}
							class="h-[var(--touch-target)] w-[var(--touch-target)]"
						/>
						<a
							href="/{data.locale}/settings"
							class="hidden h-[var(--touch-target)] w-[var(--touch-target)] shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] md:inline-flex"
							aria-label={d.nav.settings}
							title={d.nav.settings}
						>
							<Settings class="h-5 w-5" aria-hidden="true" />
						</a>
						<div
							class="flex h-[var(--touch-target)] w-[var(--touch-target)] items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-base font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
						>
							{data.initial}
						</div>
					</div>
				</header>
			{/if}
			<main
				class={immersiveTimers
					? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)] p-0'
					: 'flex-1 overflow-y-auto px-[var(--spacing-page)] py-[var(--spacing-page)] pb-[var(--ops-bottom-clearance)] md:px-[var(--spacing-page-md)] md:py-[var(--spacing-page-md)] md:pb-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)] lg:py-[var(--spacing-page-lg)] lg:pb-[var(--spacing-page-lg)]'}
			>
				{@render children()}
			</main>
		</div>
	</div>
	{#if !immersiveTimers}
		<AmrapWatermark locale={data.locale} label={d.shell.poweredBy} class="hidden md:flex" />
		<OpsMobileNav
			locale={data.locale}
			role={data.workspace.role}
			canManageSettings={data.canManageSettings}
			canManageStaff={data.canManageStaff}
			hiddenNavIds={data.workspace.hiddenNavIds}
			gymName={data.workspace.gymName}
			organizationName={data.workspace.organizationName}
			isProvisionalOwner={data.workspace.isProvisionalOwner}
			qrCode={data.qrCode}
			fullName={data.workspace.fullName}
		/>
	{/if}
</div>
