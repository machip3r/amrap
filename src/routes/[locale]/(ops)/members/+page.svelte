<script lang="ts">
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import CreateMemberDialog from '$lib/components/members/CreateMemberDialog.svelte';
	import MembersList from '$lib/components/members/MembersList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { CreateMemberState } from '$lib/server/members/actions';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const d = $derived(data.d!);

	let createOpen = $state(false);
	let highlightId = $state<string | null>(null);
	let clearTimer: ReturnType<typeof setTimeout> | null = null;

	const formResult = $derived((form ?? null) as CreateMemberState);

	function flashRow(memberId: string) {
		if (clearTimer != null) clearTimeout(clearTimer);
		highlightId = memberId;
		clearTimer = setTimeout(() => {
			highlightId = null;
			clearTimer = null;
		}, 3000);
	}
</script>

<svelte:head>
	<title>{d.members.title} — AMRAP</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="mx-auto flex w-full max-w-6xl animate-fade-in-up flex-col gap-5">
		{#if data.listError}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{d.members.error}
			</p>
		{/if}
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
					{d.members.title}
				</h1>
				<p class="mt-1 text-sm text-[var(--color-muted)]">{d.members.subtitle}</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					class="inline-flex min-h-11 items-center gap-2 shadow-sm"
					onclick={() => (createOpen = true)}
				>
					<UserPlus class="h-4 w-4" aria-hidden="true" />
					{d.members.newMember}
				</Button>
			</div>
		</header>

		<MembersList
			locale={data.locale}
			members={data.members}
			plans={data.plans}
			meta={data.meta}
			filters={data.filters}
			{highlightId}
			labels={{
				name: d.members.name,
				email: d.members.email,
				plan: d.members.plan,
				noPlan: d.members.noPlan,
				status: d.members.status,
				expires: d.members.expires,
				active: d.members.active,
				expired: d.members.expired,
				actions: d.members.actions,
				view: d.members.view,
				noMembers: d.members.noMembers,
				noResults: d.members.noResults,
				searchPlaceholder: d.members.searchPlaceholder,
				filterAll: d.members.filterAll,
				filterActive: d.members.filterActive,
				filterExpired: d.members.filterExpired,
				filterPlan: d.members.filterPlan,
				filterPlanAll: d.members.filterPlanAll,
				showing: d.members.showing,
				reload: d.members.reload,
				newBadge: d.members.newBadge,
				previous: d.common.previous,
				next: d.common.next,
				invitePending: d.inviteStatus.pending,
				inviteAccepted: d.inviteStatus.accepted,
				inviteCancelled: d.inviteStatus.cancelled
			}}
		/>
	</div>

	<CreateMemberDialog
		open={createOpen}
		onOpenChange={(open) => (createOpen = open)}
		locale={data.locale}
		{d}
		plans={data.activePlans}
		{formResult}
		onSuccess={flashRow}
	/>
{/if}
