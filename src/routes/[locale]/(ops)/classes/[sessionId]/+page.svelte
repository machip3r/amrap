<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ClassSessionBookForm from '$lib/components/classes/ClassSessionBookForm.svelte';
	import RosterCareBadges from '$lib/components/roster/RosterCareBadges.svelte';
	import RosterResultButton from '$lib/components/roster/RosterResultButton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatSessionTime } from '$lib/classes/types';
	import type { PageProps } from './$types';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
	const locale = $derived(data.locale);
	const session = $derived(data.session);
	const bookings = $derived(data.bookings);

	const confirmed = $derived(
		bookings.filter((b) => ['CONFIRMED', 'ATTENDED', 'NO_SHOW'].includes(b.status))
	);
	const waitlisted = $derived(bookings.filter((b) => b.status === 'WAITLISTED'));
	const rosterLabels = $derived({ ...d.roster, close: d.registerUser.close });

	const rosterActionClass = 'w-full sm:w-auto';

	const seatsLabel = $derived(
		session?.capacity == null
			? d.classes.unlimited
			: `${confirmed.length}/${session.capacity}`
	);

	function bookingStatusLabel(status: string) {
		switch (status) {
			case 'CONFIRMED':
				return d.classes.statusConfirmed;
			case 'ATTENDED':
				return d.classes.statusAttended;
			case 'NO_SHOW':
				return d.classes.statusNoShow;
			case 'WAITLISTED':
				return d.classes.statusWaitlisted;
			default:
				return status;
		}
	}

	function bookingStatusClass(status: string) {
		switch (status) {
			case 'ATTENDED':
				return 'bg-[var(--color-success)]/15 text-[var(--color-success)]';
			case 'NO_SHOW':
				return 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]';
			case 'WAITLISTED':
				return 'bg-[var(--color-muted)]/20 text-[var(--color-muted)]';
			default:
				return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]';
		}
	}
</script>

<svelte:head>
	<title>{brandedTitle(session?.class_name ?? d.nav.classes, data.documentBrand)}</title>
</svelte:head>

{#if data.forbidden || !session}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="flex w-full animate-fade-in-up flex-col gap-5">
		<div>
			<a
				href={`/${locale}/classes?tab=calendar`}
				class="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				<ArrowLeft class="h-4 w-4" aria-hidden="true" />
				{d.classes.tabCalendar}
			</a>
		</div>

		<header
			class="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6"
		>
			<div class="min-w-0">
				<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{session.class_name}
				</h1>
				<p class="mt-1 text-sm text-[var(--color-muted)]">
					{formatSessionTime(session.starts_at, locale)}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span
						class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {session.status ===
						'CANCELLED'
							? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
							: 'bg-[var(--color-success)]/15 text-[var(--color-success)]'}"
					>
						{session.status === 'CANCELLED' ? d.classes.cancelled : d.classes.scheduled}
					</span>
					<span
						class="inline-flex rounded-md bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text)]"
					>
						{d.classes.seats}: {seatsLabel}
					</span>
					{#if waitlisted.length > 0}
						<span
							class="inline-flex rounded-md bg-[var(--color-surface-hover)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-muted)]"
						>
							{d.classes.waitlist}: {waitlisted.length}
						</span>
					{/if}
				</div>
			</div>
			{#if data.canManage && session.status === 'SCHEDULED'}
				<form method="POST" action="?/cancelSession" use:enhance class="shrink-0 sm:pt-1">
					<input type="hidden" name="locale" value={locale} />
					<input type="hidden" name="session_id" value={session.id} />
					<Button
						type="submit"
						variant="toolbarSecondary"
						class="w-full border-[var(--color-danger)]/35 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 sm:w-auto"
					>
						{d.classes.cancelSession}
					</Button>
				</form>
			{/if}
		</header>

		{#if data.canCheckin && session.status === 'SCHEDULED'}
			<ClassSessionBookForm
				{locale}
				sessionId={session.id}
				members={data.memberOptions}
				bookedPersonIds={bookings.map((b) => b.person_id)}
				labels={{
					bookMember: d.classes.bookMember,
					selectMember: d.classes.selectMember,
					searchMember: d.classes.searchMember,
					bookHint: d.classes.bookHint,
					noMemberMatches: d.classes.noMemberMatches,
					book: d.classes.book
				}}
			/>
		{/if}

		<section>
			<div class="mb-3 flex items-center gap-2">
				<h2 class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{d.classes.roster}
				</h2>
				<span
					class="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-muted)]"
				>
					{confirmed.length}
				</span>
			</div>
			{#if confirmed.length === 0}
				<p class="text-sm text-[var(--color-muted)]">{d.classes.rosterEmpty}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each confirmed as b (b.id)}
						<li
							class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-1.5">
									<p class="font-medium text-[var(--color-text)]">{b.person_name}</p>
									<RosterCareBadges
										medicalNote={b.medical_note}
										isFirstDay={b.isFirstDay}
										isBirthday={b.isBirthday}
										labels={rosterLabels}
									/>
								</div>
								<span
									class="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold {bookingStatusClass(
										b.status
									)}"
								>
									{bookingStatusLabel(b.status)}
								</span>
							</div>
							<div
								class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
							>
								{#if data.canManage}
									<RosterResultButton
										{locale}
										sessionId={session.id}
										personId={b.person_id}
										personName={b.person_name}
										existing={b.result}
										labels={rosterLabels}
									/>
								{/if}
								{#if data.canCheckin && b.status === 'CONFIRMED'}
									<form method="POST" action="?/setBookingStatus" use:enhance class="contents">
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="booking_id" value={b.id} />
										<input type="hidden" name="session_id" value={session.id} />
										<input type="hidden" name="status" value="ATTENDED" />
										<Button type="submit" variant="toolbarSecondary" class={rosterActionClass}>
											{d.classes.markAttended}
										</Button>
									</form>
									<form method="POST" action="?/setBookingStatus" use:enhance class="contents">
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="booking_id" value={b.id} />
										<input type="hidden" name="session_id" value={session.id} />
										<input type="hidden" name="status" value="NO_SHOW" />
										<Button type="submit" variant="toolbarSecondary" class={rosterActionClass}>
											{d.classes.markNoShow}
										</Button>
									</form>
								{/if}
								{#if b.status !== 'ATTENDED' && b.status !== 'NO_SHOW'}
									<form method="POST" action="?/cancelBooking" use:enhance class="contents">
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="booking_id" value={b.id} />
										<input type="hidden" name="session_id" value={session.id} />
										<Button
											type="submit"
											variant="toolbarSecondary"
											class="{rosterActionClass} text-[var(--color-muted)]"
										>
											{d.classes.cancelBooking}
										</Button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<div class="mb-3 flex items-center gap-2">
				<h2 class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{d.classes.waitlist}
				</h2>
				<span
					class="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-muted)]"
				>
					{waitlisted.length}
				</span>
			</div>
			{#if waitlisted.length === 0}
				<p class="text-sm text-[var(--color-muted)]">{d.classes.waitlistEmpty}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each waitlisted as b (b.id)}
						<li
							class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-1.5">
									<p class="font-medium text-[var(--color-text)]">
										<span class="tabular-nums text-[var(--color-muted)]"
											>#{b.waitlist_position ?? '—'}</span
										>
										{b.person_name}
									</p>
									<RosterCareBadges
										medicalNote={b.medical_note}
										isFirstDay={b.isFirstDay}
										isBirthday={b.isBirthday}
										labels={rosterLabels}
									/>
								</div>
								<span
									class="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold {bookingStatusClass(
										'WAITLISTED'
									)}"
								>
									{bookingStatusLabel('WAITLISTED')}
								</span>
							</div>
							<form method="POST" action="?/cancelBooking" use:enhance class="contents">
								<input type="hidden" name="locale" value={locale} />
								<input type="hidden" name="booking_id" value={b.id} />
								<input type="hidden" name="session_id" value={session.id} />
								<Button
									type="submit"
									variant="toolbarSecondary"
									class="{rosterActionClass} text-[var(--color-muted)]"
								>
									{d.classes.cancelBooking}
								</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}
