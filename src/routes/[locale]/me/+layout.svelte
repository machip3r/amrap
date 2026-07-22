<script lang="ts">
	import AmrapWatermark from '$lib/components/AmrapWatermark.svelte';
	import ThemeToggle from '$lib/components/landing/ThemeToggle.svelte';
	import MemberAppNav from '$lib/components/member/MemberAppNav.svelte';
	import MemberMobileNav from '$lib/components/member/MemberMobileNav.svelte';
	import OpsNavLogo from '$lib/components/ops/OpsNavLogo.svelte';
	import { getTimersImmersive } from '$lib/timers/shell.svelte';
	import { DEFAULT_DOCUMENT_BRAND } from '$lib/seo/document-title';
	import type { Snippet } from 'svelte';

	type Props = {
		data: {
			locale: import('$lib/i18n/config').Locale;
			d: import('$lib/i18n/dictionaries').Dictionary;
			initial: string;
			gymName: string;
			showWatermark?: boolean;
			brandStyle: string;
			logoUrlLight: string | null;
			logoUrlDark: string | null;
			allowBrand?: boolean;
			documentBrand?: string | null;
			qrCode: string | null;
			member: { fullName: string | null };
		};
		children: Snippet;
	};

	let { data, children }: Props = $props();

	const immersive = $derived(getTimersImmersive());
	const showWatermark = $derived(data.showWatermark !== false);
	const profileHref = $derived(`/${data.locale}/me/profile`);
	const homeHref = $derived(`/${data.locale}/me`);
	const appName = $derived(data.documentBrand?.trim() || DEFAULT_DOCUMENT_BRAND);
	const faviconLight = $derived(data.logoUrlLight || data.logoUrlDark);
	const faviconDark = $derived(data.logoUrlDark || data.logoUrlLight);

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

<div
	class="amrap-app-shell flex flex-col overflow-hidden bg-[var(--color-bg)]"
	class:amrap-branded={data.allowBrand}
	class:amrap-no-watermark={!showWatermark}
>
	<div class="flex min-h-0 flex-1 overflow-hidden">
		{#if !immersive}
			<MemberAppNav
				locale={data.locale}
				logoUrlLight={data.logoUrlLight}
				logoUrlDark={data.logoUrlDark}
				gymName={data.gymName}
				{profileHref}
			/>
		{/if}
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			{#if !immersive}
				<header
					class="flex h-[calc(var(--ops-header-height)+var(--safe-top))] shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--spacing-page)] pt-[var(--safe-top)] sm:gap-3 sm:px-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)]"
				>
					<a
						href={homeHref}
						class="min-w-0 flex-1 md:hidden"
						aria-label={data.gymName || data.d.member.home}
					>
						<OpsNavLogo
							logoUrlLight={data.logoUrlLight}
							logoUrlDark={data.logoUrlDark}
							gymName={data.gymName}
							size="sm"
						/>
					</a>
					<div class="ml-auto flex items-center gap-2 sm:gap-3">
						<ThemeToggle
							label={data.d.a11y.toggleTheme}
							class="h-[var(--touch-target)] w-[var(--touch-target)]"
						/>
						<a
							href={profileHref}
							class="flex h-[var(--touch-target)] w-[var(--touch-target)] items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/20 text-base font-bold text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 transition-opacity hover:opacity-90"
							aria-label={data.d.member.profile}
							title={data.d.member.profile}
						>
							{data.initial}
						</a>
					</div>
				</header>
			{/if}
			<main
				class={immersive
					? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)] p-0'
					: 'flex-1 overflow-y-auto px-[var(--spacing-page)] py-[var(--spacing-page)] pb-[var(--ops-bottom-clearance)] md:px-[var(--spacing-page-md)] md:py-[var(--spacing-page-md)] md:pb-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)] lg:py-[var(--spacing-page-lg)] lg:pb-[var(--spacing-page-lg)]'}
			>
				{@render children()}
			</main>
		</div>
	</div>
	{#if !immersive}
		{#if showWatermark}
			<AmrapWatermark locale={data.locale} label={data.d.shell.poweredBy} class="hidden md:flex" />
		{/if}
		<MemberMobileNav
			locale={data.locale}
			gymName={data.gymName}
			qrCode={data.qrCode}
			fullName={data.member.fullName}
			{showWatermark}
			{profileHref}
		/>
	{/if}
</div>
