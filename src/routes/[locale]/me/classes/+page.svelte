<script lang="ts">
	import MemberClassesClient from '$lib/components/member/MemberClassesClient.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{d.member.classes} — AMRAP</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="font-title text-3xl font-bold text-[var(--color-text)]">{d.member.classes}</h1>
	<MemberClassesClient
		locale={data.locale}
		{d}
		sessions={data.sessions}
		bookings={data.bookings}
	/>
</div>
