<script lang="ts">
	import ClassesClient from '$lib/components/classes/ClassesClient.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{d.classes.title} — AMRAP</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="flex w-full animate-fade-in-up flex-col gap-5">
		<ClassesClient
			locale={data.locale}
			{d}
			classes={data.classes}
			trainers={data.trainers}
			sessions={data.sessions}
			weekStartIso={data.weekStartIso}
			orgGyms={data.orgGyms}
			currentGymId={data.currentGymId}
			canManage={data.canManage}
			currentUserId={data.currentUserId}
			lockTrainersToSelf={data.lockTrainersToSelf}
			defaultTrainerIds={data.defaultTrainerIds}
			initialView={data.initialView as 'catalog' | 'calendar'}
		/>
	</div>
{/if}
