<script lang="ts">
	import { page } from '$app/state';
	import EntityNotFound from '$lib/components/ui/EntityNotFound.svelte';
	import { defaultLocale, isLocale, type Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { resolveEntityNotFound } from '$lib/ui/entity-not-found';
	import { brandedTitle } from '$lib/seo/document-title';

	const locale = $derived.by((): Locale => {
		const seg = page.params.locale;
		return seg && isLocale(seg) ? seg : defaultLocale;
	});
	const d = $derived(getDictionary(locale));
	const status = $derived(page.status);
	const errorMessage = $derived(page.error?.message ?? null);

	const copy = $derived(
		status === 403
			? {
					title: d.entityNotFound.forbiddenTitle,
					description: d.entityNotFound.forbiddenBody,
					backHref: `/${locale}/dashboard`,
					backLabel: d.entityNotFound.goHome,
					homeHref: undefined as string | undefined,
					homeLabel: undefined as string | undefined
				}
			: resolveEntityNotFound(page.url.pathname, locale, d, errorMessage)
	);

	const documentTitle = $derived(brandedTitle(copy.title));
</script>

<svelte:head>
	<title>{documentTitle}</title>
</svelte:head>

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
