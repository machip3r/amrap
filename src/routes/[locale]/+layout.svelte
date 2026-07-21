<script lang="ts">
	import { page } from '$app/state';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { titleFromPath } from '$lib/seo/document-title';

	let { children, data } = $props();

	const d = $derived(getDictionary(data.locale));
	const documentTitle = $derived(titleFromPath(page.url.pathname, data.locale, d));

	const indexable = $derived.by(() => {
		const locale = data.locale;
		const path = page.url.pathname.replace(/\/$/, '') || '/';
		if (path === `/${locale}`) return true;
		if (path === `/${locale}/login` || path === `/${locale}/register`) return true;
		return false;
	});
</script>

<svelte:head>
	<title>{documentTitle}</title>
	{#if !indexable}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
</svelte:head>

<div lang={data.locale}>
	{@render children()}
</div>
