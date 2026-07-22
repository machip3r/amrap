<script lang="ts">
	import MemberClassesClient from '$lib/components/member/MemberClassesClient.svelte';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

<svelte:head>
	<title>{brandedTitle(d.member.classes, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-5">
	<header>
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{d.member.classes}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{d.member.classesSubtitle}</p>
	</header>
	<MemberClassesClient
		locale={data.locale}
		{d}
		sessions={data.sessions}
		weekSessions={data.weekSessions}
		weekStartIso={data.weekStartIso}
		initialView={data.initialView}
		bookings={data.bookings}
	/>
</div>
