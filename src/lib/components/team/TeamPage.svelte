<script lang="ts">
	import History from '@lucide/svelte/icons/history';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import CreateTeamMemberDialog from '$lib/components/team/CreateTeamMemberDialog.svelte';
	import TeamList from '$lib/components/team/TeamList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { Locale } from '$lib/i18n/config';
	import type { PageMeta } from '$lib/pagination';
	import type { CreateTeamMemberState } from '$lib/server/team/actions';
	import type { TeamMember } from '$lib/team/queries';

	type ListRole = 'trainer' | 'staff';

	type Props = {
		locale: Locale;
		d: Dictionary;
		listRole: ListRole;
		members: TeamMember[];
		meta: PageMeta;
		q: string;
		currentUserId: string;
		showCheckInHistory: boolean;
		formResult: CreateTeamMemberState;
	};

	let {
		locale,
		d,
		listRole,
		members,
		meta,
		q,
		currentUserId,
		showCheckInHistory,
		formResult
	}: Props = $props();

	let createOpen = $state(false);
	let highlightId = $state<string | null>(null);
	let clearTimer: ReturnType<typeof setTimeout> | null = null;

	const copy = $derived(listRole === 'trainer' ? d.trainers : d.staffPage);
	const title = $derived(copy.title);

	function flashRow(teamMemberId: string) {
		if (clearTimer != null) clearTimeout(clearTimer);
		highlightId = teamMemberId;
		clearTimer = setTimeout(() => {
			highlightId = null;
			clearTimer = null;
		}, 3000);
	}
</script>

<svelte:head>
	<title>{title} — AMRAP</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl animate-fade-in-up flex-col gap-5">
	{#if formResult?.emailWarning}
		<p
			class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3 text-sm text-[var(--color-muted)]"
			role="status"
		>
			{formResult.emailWarning}
		</p>
	{/if}
	<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
				{copy.title}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{copy.subtitle}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#if showCheckInHistory}
				<a
					href="/{locale}/checkin/history"
					class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
				>
					<History class="h-4 w-4" aria-hidden="true" />
					{d.checkin.viewAllCheckIns}
				</a>
			{/if}
			<Button
				type="button"
				class="inline-flex min-h-11 items-center gap-2 shadow-sm"
				onclick={() => (createOpen = true)}
			>
				<UserPlus class="h-4 w-4" aria-hidden="true" />
				{listRole === 'trainer' ? d.trainers.newTrainer : d.staffPage.newStaff}
			</Button>
		</div>
	</header>

	<TeamList
		{locale}
		{listRole}
		{members}
		{meta}
		{q}
		{highlightId}
		{currentUserId}
		labels={{
			name: d.members.name,
			email: d.members.email,
			joined: copy.joined,
			actions: copy.actions,
			remove: copy.remove,
			confirmRemove: copy.confirmRemove,
			noRows: listRole === 'trainer' ? d.trainers.noTrainers : d.staffPage.noStaff,
			noResults: copy.noResults,
			searchPlaceholder: copy.searchPlaceholder,
			showing: copy.showing,
			reload: copy.reload,
			newBadge: copy.newBadge,
			view: copy.view,
			previous: d.common.previous,
			next: d.common.next,
			invitePending: d.inviteStatus.pending,
			inviteAccepted: d.inviteStatus.accepted,
			inviteCancelled: d.inviteStatus.cancelled,
			cancel: d.members.cancel
		}}
	/>
</div>

<CreateTeamMemberDialog
	open={createOpen}
	onOpenChange={(open) => (createOpen = open)}
	{locale}
	{d}
	role={listRole}
	{formResult}
	onSuccess={flashRow}
/>
