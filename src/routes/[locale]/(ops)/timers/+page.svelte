<script lang="ts">
	import TimerApp from '$lib/components/timers/TimerApp.svelte';
	import type { PageProps } from './$types';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{brandedTitle(d.nav.timers, data.documentBrand)}</title>
</svelte:head>

{#if 'forbidden' in data && data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="flex min-h-0 flex-1 flex-col animate-fade-in-up">
		<TimerApp locale={data.locale} />
	</div>
{/if}
