<script lang="ts">
	import { buildSeo, type SeoInput } from '$lib/seo/meta';

	type Props = SeoInput;

	let props: Props = $props();
	const seo = $derived(buildSeo(props));
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="robots" content={seo.robots} />
	<link rel="canonical" href={seo.canonical} />
	{#each seo.hreflang as alt (alt.lang)}
		<link rel="alternate" hreflang={alt.lang} href={alt.href} />
	{/each}
	<meta property="og:type" content={seo.ogType} />
	<meta property="og:site_name" content="AMRAP" />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={seo.canonical} />
	<meta property="og:locale" content={seo.ogLocale} />
	<meta property="og:locale:alternate" content={seo.ogLocaleAlternate} />
	<meta property="og:image" content={seo.ogImage} />
	<meta property="og:image:alt" content={seo.title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={seo.ogImage} />
	{#each seo.jsonLd as block, i (i)}
		{@html `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`}
	{/each}
</svelte:head>
