<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Briefcase from '@lucide/svelte/icons/briefcase';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { Locale } from '$lib/i18n/config';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { TeamMember } from '$lib/team/queries';

	type ListRole = 'trainer' | 'staff';

	type Props = {
		locale: Locale;
		d: Dictionary;
		member: TeamMember;
		listRole: ListRole;
		isSelf: boolean;
	};

	let { locale, d, member, listRole, isSelf }: Props = $props();

	let removeOpen = $state(false);

	const copy = $derived(listRole === 'trainer' ? d.trainers : d.staffPage);
	const listHref = $derived(
		`/${locale}/${listRole === 'trainer' ? 'trainers' : 'staff'}`
	);

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
	}

	function formatJoined(iso: string) {
		try {
			return new Date(iso).toLocaleDateString(locale, {
				day: '2-digit',
				month: 'long',
				year: 'numeric'
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>{brandedTitle(member.name, typeof page.data.documentBrand === 'string' ? page.data.documentBrand : null)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-5">
	<div>
		<a
			href={listHref}
			class="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
		>
			<ArrowLeft class="h-4 w-4" aria-hidden="true" />
			{d.common.back}
		</a>
	</div>

	<header
		class="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
	>
		<div class="flex min-w-0 items-center gap-4">
			<span
				class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]"
			>
				{initials(member.name)}
			</span>
			<div class="min-w-0">
				<h1 class="font-title truncate text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{member.name}
				</h1>
				<div class="mt-2 flex flex-wrap items-center gap-2">
					<span
						class="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-text)]"
					>
						{#if listRole === 'trainer'}
							<Dumbbell class="h-3.5 w-3.5" aria-hidden="true" />
							{d.nav.trainers}
						{:else}
							<Briefcase class="h-3.5 w-3.5" aria-hidden="true" />
							{d.nav.staff}
						{/if}
					</span>
					<span
						class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {member.inviteStatus ===
						'pending'
							? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
							: member.inviteStatus === 'cancelled'
								? 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]'
								: 'bg-[var(--color-success)]/15 text-[var(--color-success)]'}"
					>
						{member.inviteStatus === 'pending'
							? d.inviteStatus.pending
							: member.inviteStatus === 'cancelled'
								? d.inviteStatus.cancelled
								: d.inviteStatus.accepted}
					</span>
				</div>
			</div>
		</div>
	</header>

	<section
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{copy.title}</h2>
		<dl class="mt-4 grid gap-4 sm:grid-cols-2">
			<div class="flex gap-3">
				<Mail class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
						{d.members.email}
					</dt>
					<dd class="mt-0.5 text-sm font-medium text-[var(--color-text)]">
						{member.email ?? '—'}
					</dd>
				</div>
			</div>
			<div class="flex gap-3">
				<Phone class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
						{copy.phone}
					</dt>
					<dd class="mt-0.5 text-sm font-medium text-[var(--color-text)]">
						{member.phone ?? '—'}
					</dd>
				</div>
			</div>
			<div class="flex gap-3 sm:col-span-2">
				<CalendarDays
					class="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]"
					aria-hidden="true"
				/>
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
						{copy.joined}
					</dt>
					<dd class="mt-0.5 text-sm font-medium tabular-nums text-[var(--color-text)]">
						{formatJoined(member.createdAt)}
					</dd>
				</div>
			</div>
		</dl>
	</section>

	{#if !isSelf}
		<section
			class="rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="min-w-0">
					<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{copy.remove}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{copy.confirmRemove}</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					class="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 self-stretch rounded-lg border border-[var(--color-danger)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 sm:w-auto sm:self-center"
					onclick={() => (removeOpen = true)}
				>
					<Trash2 class="h-4 w-4 shrink-0" aria-hidden="true" />
					{copy.remove}
				</Button>
			</div>
		</section>

		<ConfirmDialog
			open={removeOpen}
			title={copy.remove}
			description="{copy.confirmRemove} ({member.name})"
			cancelLabel={d.members.cancel}
			confirmLabel={copy.remove}
			action="?/remove"
			onclose={() => (removeOpen = false)}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="team_member_id" value={member.id} />
			<input type="hidden" name="list_role" value={listRole} />
		</ConfirmDialog>
	{/if}
</div>
