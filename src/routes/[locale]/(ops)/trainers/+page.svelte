<script lang="ts">
	import TeamPage from '$lib/components/team/TeamPage.svelte';
	import type { CreateTeamMemberState } from '$lib/server/team/actions';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const d = $derived(data.d!);
	const formResult = $derived((form ?? null) as CreateTeamMemberState);
</script>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<TeamPage
		locale={data.locale}
		{d}
		listRole="trainer"
		members={data.members}
		meta={data.meta}
		q={data.q}
		currentUserId={data.currentUserId}
		showCheckInHistory={data.showCheckInHistory}
		{formResult}
	/>
{/if}
