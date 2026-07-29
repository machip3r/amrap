<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import AmrapWatermark from '$lib/components/AmrapWatermark.svelte';
	import ThemeToggle from '$lib/components/landing/ThemeToggle.svelte';
	import AppNav from '$lib/components/ops/AppNav.svelte';
	import IdentityPicker from '$lib/components/IdentityPicker.svelte';
	import OpsMobileNav from '$lib/components/ops/OpsMobileNav.svelte';
	import OpsNavLogo from '$lib/components/ops/OpsNavLogo.svelte';
	import OpsNavProgress from '$lib/components/ops/OpsNavProgress.svelte';
	import OwnerTour from '$lib/components/tour/OwnerTour.svelte';
	import { persistBootLogo } from '$lib/branding/boot-logo';
	import type { UserIdentity } from '$lib/auth/identities';
	import { getCheckinKiosk } from '$lib/checkin/kiosk-shell.svelte';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { showAmrapWatermark } from '$lib/plans/limits';
	import { DEFAULT_DOCUMENT_BRAND } from '$lib/seo/document-title';
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
			allowBrand?: boolean;
			documentBrand?: string | null;
			qrCode: string | null;
			identities?: UserIdentity[];
			activeIdentityId?: string;
		};
		children: Snippet;
	};

	let { data, children }: Props = $props();
	const d = $derived(getDictionary(data.locale));
	/** Hide chrome without remounting page content (timers run/edit · check-in kiosk). */
	const immersive = $derived(getTimersImmersive() || getCheckinKiosk());

	const appName = $derived(data.documentBrand?.trim() || DEFAULT_DOCUMENT_BRAND);
	const faviconLight = $derived(data.logoUrlLight || data.logoUrlDark);
	const faviconDark = $derived(data.logoUrlDark || data.logoUrlLight);
	const showWatermark = $derived(showAmrapWatermark(data.workspace.planTier));

	/** Cache gym mark for the next PWA / cold-start splash. */
	$effect(() => {
		persistBootLogo({
			allowBrand: data.allowBrand,
			logoUrlLight: data.logoUrlLight,
			logoUrlDark: data.logoUrlDark,
			name: data.documentBrand ?? data.workspace.gymName
		});
	});

	/** Override static AMRAP icons in app.html so the gym logo wins in the tab. */
	$effect(() => {
		const light = faviconLight;
		const dark = faviconDark;
		if (!light && !dark) return;

		const links = document.querySelectorAll<HTMLLinkElement>(
			'link[rel="icon"], link[rel="apple-touch-icon"]'
		);
		for (const link of links) {
			const rel = link.getAttribute('rel') ?? '';
			const media = link.getAttribute('media') ?? '';
			if (rel.includes('apple-touch-icon')) {
				if (light) link.href = light;
				continue;
			}
			if (media.includes('dark')) {
				if (dark) link.href = dark;
			} else if (light) {
				link.href = light;
			}
		}
	});
</script>

<svelte:head>
	{@html `<style>${data.brandStyle}</style>`}
	<meta name="robots" content="noindex,nofollow" />
	<meta name="application-name" content={appName} />
	<meta name="apple-mobile-web-app-title" content={appName} />
	{#if faviconLight}
		<link rel="icon" href={faviconLight} type="image/png" sizes="32x32" />
		<link
			rel="icon"
			href={faviconLight}
			type="image/png"
			sizes="32x32"
			media="(prefers-color-scheme: light)"
		/>
		<link rel="apple-touch-icon" href={faviconLight} />
	{/if}
	{#if faviconDark}
		<link
			rel="icon"
			href={faviconDark}
			type="image/png"
			sizes="32x32"
			media="(prefers-color-scheme: dark)"
		/>
	{/if}
</svelte:head>

<OpsNavProgress />

<div
	class="amrap-branded amrap-app-shell flex flex-col overflow-hidden bg-[var(--color-bg)]"
	class:amrap-no-watermark={!showWatermark}
>
	<div class="flex min-h-0 flex-1 overflow-hidden">
		{#if !immersive}
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
		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			{#if !immersive}
				<header
					class="relative z-40 flex h-[calc(var(--ops-header-height)+var(--safe-top))] shrink-0 items-center gap-2 overflow-visible border-b border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--spacing-page)] pt-[var(--safe-top)] sm:gap-3 sm:px-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)]"
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
					<div class="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
						{#if (data.identities?.length ?? 0) > 1 && data.activeIdentityId}
							<IdentityPicker
								locale={data.locale}
								identities={data.identities ?? []}
								activeId={data.activeIdentityId}
								labels={d.shell}
								compact
								class="max-w-[9.5rem] sm:max-w-[14rem]"
							/>
						{/if}
						<ThemeToggle
							label={d.a11y.toggleTheme}
							class="h-[var(--touch-target)] w-[var(--touch-target)] shrink-0"
						/>
						<a
							href="/{data.locale}/settings"
							class="hidden h-[var(--touch-target)] w-[var(--touch-target)] shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] md:inline-flex"
							aria-label={d.nav.settings}
							title={d.nav.settings}
						>
							<Settings class="h-5 w-5" aria-hidden="true" />
						</a>
						<a
							href="/{data.locale}/profile"
							class="flex h-[var(--touch-target)] w-[var(--touch-target)] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-base font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 transition-opacity hover:opacity-90"
							aria-label={d.member.profile}
							title={d.member.profile}
						>
							{data.initial}
						</a>
					</div>
				</header>
			{/if}
			<main
				class={immersive
					? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)] p-0'
					: 'min-h-0 flex-1 overflow-y-auto px-[var(--spacing-page)] py-[var(--spacing-page)] pb-[var(--ops-bottom-clearance)] md:px-[var(--spacing-page-md)] md:py-[var(--spacing-page-md)] md:pb-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)] lg:py-[var(--spacing-page-lg)] lg:pb-[var(--spacing-page-lg)]'}
			>
				{@render children()}
			</main>
		</div>
	</div>
	{#if !immersive}
		{#if showWatermark}
			<AmrapWatermark locale={data.locale} label={d.shell.poweredBy} class="hidden md:flex" />
		{/if}
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
			{showWatermark}
			identities={data.identities ?? []}
			activeIdentityId={data.activeIdentityId ?? `ops:${data.workspace.gymId}`}
		/>
	{/if}

	{#if !immersive && data.workspace.canActAsOwner}
		<OwnerTour locale={data.locale} {d} enabled={true} />
	{/if}
</div>
