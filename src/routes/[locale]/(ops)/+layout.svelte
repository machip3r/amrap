<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import AmrapWatermark from '$lib/components/AmrapWatermark.svelte';
	import ThemeToggle from '$lib/components/landing/ThemeToggle.svelte';
	import AppNav from '$lib/components/ops/AppNav.svelte';
	import OpsMobileNav from '$lib/components/ops/OpsMobileNav.svelte';
	import OpsNavLogo from '$lib/components/ops/OpsNavLogo.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		data: {
			locale: import('$lib/i18n/config').Locale;
			d: import('$lib/i18n/dictionaries').Dictionary;
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
</script>

<svelte:head>
	{@html `<style>${data.brandStyle}</style>`}
</svelte:head>

<div class="amrap-branded flex h-screen flex-col overflow-hidden bg-[var(--color-bg)]">
	<div class="flex min-h-0 flex-1 overflow-hidden">
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
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			<header
				class="flex h-[4.5rem] shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:h-[4.25rem] sm:gap-3 sm:px-6"
			>
				<a
					href="/{data.locale}/dashboard"
					class="min-w-0 flex-1 md:hidden"
					aria-label={data.workspace.gymName || data.d.nav.dashboard}
				>
					<OpsNavLogo
						logoUrlLight={data.logoUrlLight}
						logoUrlDark={data.logoUrlDark}
						gymName={data.workspace.gymName}
						size="sm"
					/>
				</a>
				<div class="ml-auto flex items-center gap-2 sm:gap-3">
					<ThemeToggle label={data.d.a11y.toggleTheme} class="h-12 w-12 sm:h-11 sm:w-11" />
					<a
						href="/{data.locale}/settings"
						class="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] md:inline-flex"
						aria-label={data.d.nav.settings}
						title={data.d.nav.settings}
					>
						<Settings class="h-5 w-5" aria-hidden="true" />
					</a>
					<div
						class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-base font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 sm:h-10 sm:w-10 sm:text-sm"
					>
						{data.initial}
					</div>
				</div>
			</header>
			<main
				class="flex-1 overflow-y-auto p-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6 lg:p-8"
			>
				{@render children()}
			</main>
		</div>
	</div>
	<AmrapWatermark locale={data.locale} label={data.d.shell.poweredBy} class="hidden md:flex" />
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
</div>
