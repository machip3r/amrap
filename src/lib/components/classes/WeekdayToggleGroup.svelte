<script lang="ts">
	const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

	type Props = {
		name?: string;
		labels: readonly [string, string, string, string, string, string, string];
		defaultSelected?: number[];
		error?: string;
		legend: string;
	};

	let {
		name = 'days_of_week',
		labels,
		defaultSelected = [1, 2, 3, 4, 5],
		error = undefined,
		legend
	}: Props = $props();

	let selected = $state(new Set(defaultSelected));

	function toggle(day: number) {
		const next = new Set(selected);
		if (next.has(day)) next.delete(day);
		else next.add(day);
		selected = next;
	}

	const selectedSorted = $derived([...selected].sort((a, b) => a - b));
</script>

<fieldset>
	<legend class="mb-2 text-sm font-medium text-[var(--color-text)]">{legend}</legend>
	<div
		class="grid grid-cols-7 gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1.5"
		role="group"
		aria-label={legend}
	>
		{#each ISO_DAYS as day, i (day)}
			{@const on = selected.has(day)}
			<button
				type="button"
				aria-pressed={on}
				onclick={() => toggle(day)}
				class="flex min-h-11 items-center justify-center rounded-md px-0.5 text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:text-xs {on
					? 'bg-[var(--color-primary)] text-[var(--color-primary-on)] shadow-sm'
					: 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'}"
			>
				{labels[i]}
			</button>
		{/each}
	</div>
	{#each selectedSorted as day (day)}
		<input type="hidden" {name} value={day} />
	{/each}
	{#if error}
		<p class="mt-1.5 text-sm text-[var(--color-primary)]" role="alert">{error}</p>
	{/if}
</fieldset>
