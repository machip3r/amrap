<script lang="ts">
	import TimerApp from '$lib/components/timers/TimerApp.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{d.member.timers} — AMRAP</title>
</svelte:head>

<div class="w-full">
	<TimerApp locale={data.locale} />
</div>
