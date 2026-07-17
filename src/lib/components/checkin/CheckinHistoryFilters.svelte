<script lang="ts">
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		date: string;
		today: string;
		labels: {
			filterDate: string;
			filterApply: string;
			filterClear: string;
		};
	};

	let { date, today, labels }: Props = $props();

	let dateValue = $state('');
	let pending = $state(false);

	$effect(() => {
		dateValue = date;
	});

	const hasFilter = $derived(date !== today);

	async function apply(e: Event) {
		e.preventDefault();
		const value = dateValue.trim() || today;
		pending = true;
		try {
			const params = new URLSearchParams();
			params.set('date', value);
			await goto(`?${params.toString()}`);
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
	class="flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
>
	<div class="flex w-full min-w-0 flex-col gap-1.5">
		<label
			for="checkin-date"
			class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
		>
			{labels.filterDate}
		</label>
		<Input id="checkin-date" name="date" type="date" bind:value={dateValue} />
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
