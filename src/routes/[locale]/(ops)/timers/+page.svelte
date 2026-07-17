<script lang="ts">
	import TimerApp from '$lib/components/timers/TimerApp.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{d.nav.timers} — AMRAP</title>
</svelte:head>

{#if 'forbidden' in data && data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="mx-auto w-full max-w-3xl animate-fade-in-up">
		<TimerApp locale={data.locale} />
	</div>
{/if}
