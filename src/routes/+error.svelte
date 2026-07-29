<script lang="ts">
	import { page } from '$app/state';
	import EntityNotFound from '$lib/components/ui/EntityNotFound.svelte';
	import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { negotiateLocale } from '$lib/i18n/negotiate-locale';
	import { brandedTitle } from '$lib/seo/document-title';
	import { resolveEntityNotFound } from '$lib/ui/entity-not-found';

	/** Prefer locale from the URL; fall back to Accept-Language / default. */
	const locale = $derived.by((): Locale => {
		const seg = page.url.pathname.split('/').filter(Boolean)[0];
		if (seg && isLocale(seg)) return seg;
		if (typeof navigator !== 'undefined') {
			return negotiateLocale(navigator.language);
		}
		return defaultLocale;
	});

	const d = $derived(getDictionary(locale));
	const status = $derived(page.status);
	const errorMessage = $derived(page.error?.message ?? null);

	const copy = $derived(
		status === 403
			? {
					title: d.entityNotFound.forbiddenTitle,
					description: d.entityNotFound.forbiddenBody,
					backHref: `/${locale}`,
					backLabel: d.entityNotFound.goLanding,
					homeHref: `/${locale}/dashboard` as string | undefined,
					homeLabel: d.entityNotFound.goHome as string | undefined
				}
			: status === 404 || status >= 400
				? resolveEntityNotFound(page.url.pathname, locale, d, errorMessage)
				: {
						title: d.entityNotFound.titleGeneric,
						description: d.entityNotFound.bodyGeneric,
						backHref: `/${locale}`,
						backLabel: d.entityNotFound.goLanding,
						homeHref: undefined as string | undefined,
						homeLabel: undefined as string | undefined
					}
	);

	const documentTitle = $derived(brandedTitle(copy.title));
</script>

<svelte:head>
	<title>{documentTitle}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="amrap-app-shell flex min-h-[var(--app-height,100dvh)] flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
	<main class="flex flex-1 items-center justify-center p-[var(--spacing-page)] lg:px-[var(--spacing-page-x-lg)]">
		<div class="animate-fade-in-up w-full">
			<EntityNotFound
				title={copy.title}
				description={copy.description}
				backHref={copy.backHref}
				backLabel={copy.backLabel}
				homeHref={copy.homeHref}
				homeLabel={copy.homeLabel}
			/>
		</div>
	</main>
</div>
