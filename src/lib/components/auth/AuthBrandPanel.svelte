<script lang="ts">
	import OpsNavLogo from '$lib/components/ops/OpsNavLogo.svelte';
	import type { AuthShellBrand } from '$lib/branding/auth-shell';
	import type { Snippet } from 'svelte';

	type Props = {
		locale: string;
		brand: AuthShellBrand | null;
		title: string;
		subtitle?: string;
		children: Snippet;
		footer?: Snippet;
	};

	let { locale, brand, title, subtitle = '', children, footer }: Props = $props();

	const logoLabel = $derived(brand?.documentBrand?.trim() || 'AMRAP');
	const brandStyle = $derived(brand?.brandStyle ?? '');
	const favLight = $derived(brand?.logoUrlLight || brand?.logoUrlDark || null);
	const favDark = $derived(brand?.logoUrlDark || brand?.logoUrlLight || null);
</script>

<svelte:head>
	{#if brandStyle}
		{@html `<style>${brandStyle}</style>`}
		<meta name="application-name" content={logoLabel} />
		<meta name="apple-mobile-web-app-title" content={logoLabel} />
		{#if favLight}
			<link rel="icon" href={favLight} type="image/png" sizes="32x32" />
			<link rel="apple-touch-icon" href={favLight} />
		{/if}
		{#if favDark && favDark !== favLight}
			<link
				rel="icon"
				href={favDark}
				type="image/png"
				sizes="32x32"
				media="(prefers-color-scheme: dark)"
			/>
		{/if}
	{/if}
</svelte:head>

<div
	class="amrap-branded auth-container flex min-h-dvh flex-col items-center justify-center px-[var(--spacing-page)] py-4 sm:px-6 sm:py-6"
>
	<div
		class="glass-panel animate-fade-in-up flex w-full max-w-md flex-col rounded-2xl p-8 shadow-2xl sm:p-10"
	>
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="mb-5 flex w-full justify-center">
				<a href="/{locale}" aria-label={logoLabel} class="inline-flex justify-center">
					<OpsNavLogo
						logoUrlLight={brand?.logoUrlLight ?? null}
						logoUrlDark={brand?.logoUrlDark ?? null}
						gymName={brand?.gymName || logoLabel}
						size="lg"
						class="object-center"
					/>
				</a>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
			{#if subtitle}
				<p class="mt-2 text-sm text-[var(--color-muted)]">{subtitle}</p>
			{/if}
		</div>

		{@render children()}

		{#if footer}
			<div class="mt-8 border-t border-[var(--color-border)] pt-5 text-center">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
