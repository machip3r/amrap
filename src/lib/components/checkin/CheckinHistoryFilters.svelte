<script lang="ts">
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { CheckInPersonType } from '$lib/checkin/queries';

	type Props = {
		date: string;
		today: string;
		personType: CheckInPersonType | null;
		labels: {
			filterDate: string;
			filterPersonType: string;
			filterAllTypes: string;
			filterMembers: string;
			filterTrainers: string;
			filterStaff: string;
			filterApply: string;
			filterClear: string;
		};
	};

	let { date, today, personType, labels }: Props = $props();

	let dateValue = $state('');
	let typeValue = $state<CheckInPersonType | ''>('');
	let pending = $state(false);

	$effect(() => {
		dateValue = date;
		typeValue = personType ?? '';
	});

	const hasFilter = $derived(date !== today || personType != null);

	function buildParams(nextDate: string, nextType: CheckInPersonType | '') {
		const params = new URLSearchParams();
		params.set('date', nextDate);
		if (nextType) params.set('type', nextType);
		return params;
	}

	async function apply(e: Event) {
		e.preventDefault();
		const value = dateValue.trim() || today;
		pending = true;
		try {
			await goto(`?${buildParams(value, typeValue).toString()}`);
		} finally {
			pending = false;
		}
	}

	async function clear() {
		pending = true;
		try {
			await goto(`?date=${today}`);
		} finally {
			pending = false;
		}
	}
</script>

<form
	onsubmit={apply}
	class="flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
>
	<div class="grid w-full min-w-0 gap-3 sm:grid-cols-2">
		<div class="flex min-w-0 flex-col gap-1.5 overflow-hidden">
			<label
				for="checkin-date"
				class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
			>
				{labels.filterDate}
			</label>
			<Input
				id="checkin-date"
				name="date"
				type="date"
				class="min-w-0 max-w-full [&::-webkit-calendar-picker-indicator]:shrink-0"
				bind:value={dateValue}
			/>
		</div>
		<div class="flex min-w-0 flex-col gap-1.5 overflow-hidden">
			<label
				for="checkin-person-type"
				class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
			>
				{labels.filterPersonType}
			</label>
			<Select id="checkin-person-type" name="type" bind:value={typeValue}>
				<option value="">{labels.filterAllTypes}</option>
				<option value="member">{labels.filterMembers}</option>
				<option value="trainer">{labels.filterTrainers}</option>
				<option value="staff">{labels.filterStaff}</option>
			</Select>
		</div>
	</div>
	<div class="flex w-full gap-2">
		<Button type="submit" variant="primary" disabled={pending} class="min-h-11 min-w-0 flex-1">
			{labels.filterApply}
		</Button>
		{#if hasFilter}
			<button
				type="button"
				disabled={pending}
				onclick={clear}
				class="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:opacity-70"
			>
				{labels.filterClear}
			</button>
		{/if}
	</div>
</form>
