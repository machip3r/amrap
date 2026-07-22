<script lang="ts">
	import TimerApp from '$lib/components/timers/TimerApp.svelte';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{brandedTitle(d.member.timers, data.documentBrand)}</title>
</svelte:head>

<div class="w-full">
	<TimerApp locale={data.locale} />
</div>
