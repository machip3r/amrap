<script lang="ts">
	import LandingPage from '$lib/components/landing/LandingPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<link rel="icon" href="/favicon-light.png" type="image/png" media="(prefers-color-scheme: light)" />
	<link rel="icon" href="/favicon-dark.png" type="image/png" media="(prefers-color-scheme: dark)" />
	<link
		rel="icon"
		href="/favicon-light-48.png"
		sizes="48x48"
		type="image/png"
		media="(prefers-color-scheme: light)"
	/>
	<link
		rel="icon"
		href="/favicon-dark-48.png"
		sizes="48x48"
		type="image/png"
		media="(prefers-color-scheme: dark)"
	/>
	<link rel="apple-touch-icon" href="/amrap-icon.png" type="image/png" />
</svelte:head>

<div class="landing-root">
	<LandingPage locale={data.locale} d={data.d} />
</div>
