<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { totalSeconds } from '$lib/timers/timeline';
	import { formatClock, type TimerRoutine } from '$lib/timers/types';

	type Labels = Dictionary['timers'];

	type Props = {
		routines: TimerRoutine[];
		labels: Labels;
		onOpen: (id: string) => void;
		onEdit: (id: string) => void;
		onDelete: (id: string) => void;
		onCreate: () => void;
	};

	let { routines, labels, onOpen, onEdit, onDelete, onCreate }: Props = $props();
</script>

<div class="flex w-full flex-col gap-5">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0">
			<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
				{labels.routinesTitle}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.routinesSubtitle}</p>
		</div>
		<Button type="button" variant="toolbar" onclick={onCreate}>
			<Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
			<span class="shrink-0">{labels.create}</span>
		</Button>
	</header>

	{#if routines.length === 0}
		<p
			class="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center text-sm text-[var(--color-muted)]"
		>
			{labels.emptyRoutines}
		</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each routines as r (r.id)}
				<li>
					<div
						class="flex overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
					>
						<button
							type="button"
							onclick={() => onOpen(r.id)}
							class="flex min-h-24 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-5 text-left transition-colors hover:bg-[var(--color-surface-hover)]/60 sm:min-h-20 sm:py-4"
						>
							<span class="truncate text-xl font-semibold text-[var(--color-text)] sm:text-lg">
								{r.name || labels.unnamed}
							</span>
							<span
								class="shrink-0 tabular-nums text-lg font-medium text-[var(--color-muted)] sm:text-base"
							>
								{formatClock(totalSeconds(r))}
							</span>
						</button>
						<div
							class="flex shrink-0 items-center gap-0.5 border-l border-[var(--color-border)] px-1.5"
						>
							<button
								type="button"
								onclick={() => onEdit(r.id)}
								class="inline-flex h-14 w-14 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
								aria-label={labels.edit}
								title={labels.edit}
							>
								<Pencil class="h-5 w-5" aria-hidden="true" />
							</button>
							<button
								type="button"
								onclick={() => onDelete(r.id)}
								class="inline-flex h-14 w-14 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
								aria-label={labels.delete}
								title={labels.delete}
							>
								<Trash2 class="h-5 w-5" aria-hidden="true" />
							</button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
