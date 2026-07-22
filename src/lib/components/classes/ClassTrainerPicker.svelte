<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import UserRoundX from '@lucide/svelte/icons/user-round-x';

	export type ClassTrainerOption = {
		userId: string;
		name: string;
	};

	type Props = {
		trainers: ClassTrainerOption[];
		selectedIds?: string[];
		labels: {
			trainers: string;
			trainersHint: string;
			noTrainer: string;
			noTrainerHint: string;
		};
		error?: string | null;
		/** When true, omit the field label (parent already shows one). */
		hideLabel?: boolean;
	};

	let {
		trainers,
		selectedIds = $bindable([]),
		labels,
		error = null,
		hideLabel = false
	}: Props = $props();

	const noneSelected = $derived(selectedIds.length === 0);

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
	}

	function selectNone() {
		selectedIds = [];
	}

	function toggleTrainer(userId: string) {
		if (selectedIds.includes(userId)) {
			selectedIds = selectedIds.filter((id) => id !== userId);
		} else {
			selectedIds = [...selectedIds, userId];
		}
	}

	function rowClass(active: boolean) {
		if (active) {
			return 'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] px-3 py-2.5 text-left transition-colors';
		}
		return 'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-[var(--color-surface)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-hover)]';
	}
</script>

<div>
	{#if !hideLabel}
		<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">{labels.trainers}</p>
	{/if}
	<p class="mb-2 text-xs text-[var(--color-muted)]">{labels.trainersHint}</p>

	<ul
		class="max-h-56 space-y-1.5 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2"
		role="group"
		aria-label={labels.trainers}
	>
		<li>
			<button type="button" class={rowClass(noneSelected)} onclick={selectNone}>
				<span
					class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
					aria-hidden="true"
				>
					<UserRoundX class="h-4 w-4" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm font-medium text-[var(--color-text)]"
						>{labels.noTrainer}</span
					>
					<span class="block truncate text-xs text-[var(--color-muted)]"
						>{labels.noTrainerHint}</span
					>
				</span>
				{#if noneSelected}
					<span
						class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-on)]"
						aria-hidden="true"
					>
						<Check class="h-3.5 w-3.5" />
					</span>
				{/if}
			</button>
		</li>
		{#each trainers as t (t.userId)}
			{@const active = selectedIds.includes(t.userId)}
			<li>
				<button type="button" class={rowClass(active)} onclick={() => toggleTrainer(t.userId)}>
					<span
						class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]"
						aria-hidden="true"
					>
						{initials(t.name)}
					</span>
					<span class="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text)]"
						>{t.name}</span
					>
					{#if active}
						<span
							class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-on)]"
							aria-hidden="true"
						>
							<Check class="h-3.5 w-3.5" />
						</span>
						<input type="hidden" name="trainer_ids" value={t.userId} />
					{/if}
				</button>
			</li>
		{/each}
	</ul>

	{#if error}
		<p class="mt-1.5 text-sm font-medium text-[var(--color-primary)]" role="alert">{error}</p>
	{/if}
</div>
