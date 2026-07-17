<script lang="ts">
	import TeamMemberDetail from '$lib/components/team/TeamMemberDetail.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
</script>

{#if data.forbidden || !data.member}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<TeamMemberDetail
		locale={data.locale}
		{d}
		member={data.member}
		listRole={data.listRole}
		isSelf={data.isSelf}
	/>
{/if}
