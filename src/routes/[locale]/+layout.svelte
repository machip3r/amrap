<script lang="ts">
	import { page } from '$app/state';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { titleFromPath } from '$lib/seo/document-title';

	let { children, data } = $props();

	const d = $derived(getDictionary(data.locale));
	const documentBrand = $derived(
		typeof page.data.documentBrand === 'string' ? page.data.documentBrand : null
	);
	const documentTitle = $derived(
		titleFromPath(page.url.pathname, data.locale, d, documentBrand)
	);

	const path = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	const indexable = $derived.by(() => {
		const locale = data.locale;
		if (path === `/${locale}`) return true;
		if (path === `/${locale}/login` || path === `/${locale}/register`) return true;
		return false;
	});
	/** Landing / login / register set the canonical title via SeoHead — avoid a second <title>. */
	const seoHeadOwnsTitle = $derived(indexable);
</script>

<svelte:head>
	{#if !seoHeadOwnsTitle}
		<title>{documentTitle}</title>
	{/if}
	{#if !indexable}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
</svelte:head>

<div lang={data.locale}>
	{@render children()}
</div>
