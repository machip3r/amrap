<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import LandingPage from '$lib/components/landing/LandingPage.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { isStandalonePwa } from '$lib/pwa/standalone';
	import {
		faqPageJsonLd,
		organizationJsonLd,
		softwareApplicationJsonLd,
		webSiteJsonLd
	} from '$lib/seo/meta';
	import { localePath } from '$lib/seo/site';

	let { data } = $props();

	/** Existing installs still open marketing via old start_url — bounce into the app shell. */
	let pwaRedirecting = $state(false);
	$effect(() => {
		if (!browser) return;
		if (!isStandalonePwa()) return;
		pwaRedirecting = true;
		void goto('/app', { replaceState: true });
	});

	const jsonLd = $derived([
		webSiteJsonLd({ name: 'AMRAP', locale: data.locale }),
		organizationJsonLd({
			name: 'AMRAP',
			email: data.d.footer.email,
			addressLocality: data.locale === 'es' ? 'León, Guanajuato' : 'León, Guanajuato',
			addressCountry: 'MX'
		}),
		softwareApplicationJsonLd({
			name: 'AMRAP',
			description: data.meta.description,
			locale: data.locale
		}),
		faqPageJsonLd(data.d.faq.items)
	]);
</script>

{#if !pwaRedirecting}
	<SeoHead
		locale={data.locale}
		title={data.meta.title}
		description={data.meta.description}
		path={localePath(data.locale)}
		jsonLd={jsonLd}
	/>

	<div class="landing-root">
		<LandingPage locale={data.locale} d={data.d} />
	</div>
{/if}
