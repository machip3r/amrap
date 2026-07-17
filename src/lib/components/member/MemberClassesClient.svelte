<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatSessionTime } from '$lib/classes/types';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';

	export type MemberSessionCard = {
		id: string;
		className: string;
		startsAt: string;
		capacity: number | null;
		confirmedCount: number;
		waitlistCount: number;
		myStatus: string | null;
		myBookingId: string | null;
	};

	export type MemberBookingCard = {
		id: string;
		className: string;
		startsAt: string;
		status: string;
		upcoming: boolean;
	};

	type Props = {
		locale: Locale;
		d: Dictionary;
		sessions: MemberSessionCard[];
		bookings: MemberBookingCard[];
	};

	let { locale, d, sessions, bookings }: Props = $props();

	let pending = $state(false);

	const labels = $derived(d.member);
	const upcomingBookings = $derived(bookings.filter((b) => b.upcoming));
	const history = $derived(bookings.filter((b) => !b.upcoming));

	function statusLabel(status: string) {
		switch (status) {
			case 'confirmed':
				return labels.statusConfirmed;
			case 'waitlisted':
				return labels.statusWaitlisted;
			case 'cancelled':
				return labels.statusCancelled;
			case 'attended':
				return labels.statusAttended;
			case 'no_show':
				return labels.statusNoShow;
			default:
				return status;
		}
	}
</script>

<div class="flex flex-col gap-8">
	<section>
		<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
			{labels.upcoming}
		</h2>
		{#if sessions.length === 0}
			<p class="text-sm text-[var(--color-muted)]">{labels.emptySessions}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each sessions as s (s.id)}
					{@const full = s.capacity != null && s.confirmedCount >= s.capacity}
					{@const seats = s.capacity == null ? '∞' : `${s.confirmedCount}/${s.capacity}`}
					<li
						class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
					>
						<div class="min-w-0">
							<p class="font-semibold text-[var(--color-text)]">{s.className}</p>
							<p class="text-xs text-[var(--color-muted)]">
								{formatSessionTime(s.startsAt, locale)}
							</p>
							<p class="mt-1 text-xs text-[var(--color-muted)]">
								{labels.seats}: {seats}{s.waitlistCount > 0
									? ` · ${labels.waitlist}: ${s.waitlistCount}`
									: ''}
							</p>
							{#if s.myStatus}
								<p class="mt-1 text-xs font-medium text-[var(--color-primary)]">
									{statusLabel(s.myStatus)}
								</p>
							{/if}
						</div>
						<div class="shrink-0">
							{#if s.myBookingId && (s.myStatus === 'confirmed' || s.myStatus === 'waitlisted')}
								<form
									method="POST"
									action="?/cancel"
									use:enhance={() => {
										pending = true;
										return async ({ update }) => {
											pending = false;
											await update();
										};
									}}
								>
									<input type="hidden" name="locale" value={locale} />
									<input type="hidden" name="booking_id" value={s.myBookingId} />
									<Button type="submit" variant="ghost" disabled={pending} class="text-sm">
										{labels.cancel}
									</Button>
								</form>
							{:else if !s.myStatus}
								<form
									method="POST"
									action="?/book"
									use:enhance={() => {
										pending = true;
										return async ({ update }) => {
											pending = false;
											await update();
										};
									}}
								>
									<input type="hidden" name="locale" value={locale} />
									<input type="hidden" name="session_id" value={s.id} />
									<Button type="submit" disabled={pending} class="text-sm shadow-sm">
										{full ? labels.joinWaitlist : labels.book}
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
		<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
			{labels.myBookings}
		</h2>
		{#if upcomingBookings.length === 0}
			<p class="text-sm text-[var(--color-muted)]">{labels.emptyBookings}</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each upcomingBookings as b (b.id)}
					<li class="rounded-xl border border-[var(--color-border)] px-4 py-3">
						<p class="font-medium">{b.className}</p>
						<p class="text-xs text-[var(--color-muted)]">
							{formatSessionTime(b.startsAt, locale)} · {statusLabel(b.status)}
						</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if history.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
				{labels.history}
			</h2>
			<ul class="flex flex-col gap-2">
				{#each history as b (b.id)}
					<li class="rounded-xl border border-[var(--color-border)]/60 px-4 py-3 opacity-80">
						<p class="font-medium">{b.className}</p>
						<p class="text-xs text-[var(--color-muted)]">
							{formatSessionTime(b.startsAt, locale)} · {statusLabel(b.status)}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
