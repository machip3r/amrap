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
		bookings.filter((b) => ['confirmed', 'attended', 'no_show'].includes(b.status))
	);
	const waitlisted = $derived(bookings.filter((b) => b.status === 'waitlisted'));
	const rosterLabels = $derived({ ...d.roster, close: d.registerUser.close });
</script>

<svelte:head>
	<title>{brandedTitle(session?.class_name ?? d.nav.classes, data.documentBrand)}</title>
</svelte:head>

{#if data.forbidden || !session}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="flex w-full animate-fade-in-up flex-col gap-6">
		<div>
			<a
				href={`/${locale}/classes?tab=calendar`}
				class="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
			>
				<ArrowLeft class="h-4 w-4" />
				{d.classes.tabCalendar}
			</a>
			<h1 class="mt-3 font-title text-3xl font-bold text-[var(--color-text)]">
				{session.class_name}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				{formatSessionTime(session.starts_at, locale)}
				{session.status === 'cancelled' ? ` · ${d.classes.cancelled}` : ''}
			</p>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				{d.classes.seats}:
				{session.capacity == null
					? d.classes.unlimited
					: `${confirmed.length}/${session.capacity}`}
				{waitlisted.length > 0 ? ` · ${d.classes.waitlist}: ${waitlisted.length}` : ''}
			</p>
		</div>

		{#if data.canManage && session.status === 'scheduled'}
			<form method="POST" action="?/cancelSession" use:enhance>
				<input type="hidden" name="locale" value={locale} />
				<input type="hidden" name="session_id" value={session.id} />
				<Button type="submit" variant="ghost" class="text-sm">{d.classes.cancelSession}</Button>
			</form>
		{/if}

		{#if data.canCheckin && session.status === 'scheduled'}
			<ClassSessionBookForm
				{locale}
				sessionId={session.id}
				members={data.memberOptions}
				bookedPersonIds={bookings.map((b) => b.person_id)}
				labels={{
					bookMember: d.classes.bookMember,
					selectMember: d.classes.selectMember,
					book: d.classes.book
				}}
			/>
		{/if}

		<section>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{d.classes.roster}
			</h2>
			{#if confirmed.length === 0}
				<p class="text-sm text-[var(--color-muted)]">{d.classes.rosterEmpty}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each confirmed as b (b.id)}
						<li
							class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
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
								<p class="text-xs text-[var(--color-muted)]">{b.status}</p>
							</div>
							<div class="flex flex-wrap gap-1">
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
								{#if data.canCheckin && b.status === 'confirmed'}
									<form method="POST" action="?/setBookingStatus" use:enhance>
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="booking_id" value={b.id} />
										<input type="hidden" name="session_id" value={session.id} />
										<input type="hidden" name="status" value="attended" />
										<button
											type="submit"
											class="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
										>
											{d.classes.markAttended}
										</button>
									</form>
									<form method="POST" action="?/setBookingStatus" use:enhance>
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="booking_id" value={b.id} />
										<input type="hidden" name="session_id" value={session.id} />
										<input type="hidden" name="status" value="no_show" />
										<button
											type="submit"
											class="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
										>
											{d.classes.markNoShow}
										</button>
									</form>
								{/if}
								{#if b.status !== 'attended' && b.status !== 'no_show'}
									<form method="POST" action="?/cancelBooking" use:enhance>
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="booking_id" value={b.id} />
										<input type="hidden" name="session_id" value={session.id} />
										<button
											type="submit"
											class="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted)]"
										>
											{d.classes.cancelBooking}
										</button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{d.classes.waitlist}
			</h2>
			{#if waitlisted.length === 0}
				<p class="text-sm text-[var(--color-muted)]">{d.classes.waitlistEmpty}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each waitlisted as b (b.id)}
						<li
							class="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3"
						>
							<div class="flex flex-wrap items-center gap-1.5">
								<p class="font-medium">#{b.waitlist_position ?? '—'} {b.person_name}</p>
								<RosterCareBadges
									medicalNote={b.medical_note}
									isFirstDay={b.isFirstDay}
									isBirthday={b.isBirthday}
									labels={rosterLabels}
								/>
							</div>
							<form method="POST" action="?/cancelBooking" use:enhance>
								<input type="hidden" name="locale" value={locale} />
								<input type="hidden" name="booking_id" value={b.id} />
								<input type="hidden" name="session_id" value={session.id} />
								<button
									type="submit"
									class="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
								>
									{d.classes.cancelBooking}
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}
