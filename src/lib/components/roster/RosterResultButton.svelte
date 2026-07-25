<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { SessionRosterResult } from '$lib/classes/queries';
	import type { Dictionary } from '$lib/i18n/dictionaries';

	type Labels = Dictionary['roster'] & { close: string };

	type Props = {
		locale: string;
		sessionId: string;
		personId: string;
		personName: string;
		existing: SessionRosterResult | null;
		labels: Labels;
	};

	let { locale, sessionId, personId, personName, existing, labels }: Props = $props();

	let open = $state(false);
	let kind = $state<'AMRAP' | 'STRENGTH' | 'FOR_TIME'>(
		existing?.kind === 'STRENGTH' || existing?.kind === 'FOR_TIME' ? existing.kind : 'AMRAP'
	);
	let pending = $state(false);
	let error = $state<string | null>(null);

	const existingMins =
		existing?.time_seconds != null ? Math.floor(existing.time_seconds / 60) : '';
	const existingSecs = existing?.time_seconds != null ? existing.time_seconds % 60 : '';
</script>

<Button type="button" variant="toolbarSecondary" class="w-full sm:w-auto" onclick={() => (open = true)}>
	{labels.recordResult}{existing ? ' ✓' : ''}
</Button>

<Dialog
	open={open}
	onOpenChange={(o) => (open = o)}
	title={`${labels.resultTitle} · ${personName}`}
	closeLabel={labels.close}
	class="max-w-lg"
>
	<form
		method="POST"
		action="?/upsertResult"
		class="flex flex-col gap-4"
		use:enhance={() => {
			pending = true;
			error = null;
			return async ({ result, update }) => {
				pending = false;
				if (result.type === 'success' && result.data && typeof result.data === 'object') {
					const data = result.data as { error?: string; success?: boolean };
					if (data.error) {
						error = data.error;
						return;
					}
					open = false;
				}
				await update();
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="session_id" value={sessionId} />
		<input type="hidden" name="person_id" value={personId} />
		<input type="hidden" name="kind" value={kind} />

		<div class="flex flex-wrap gap-1">
			{#each [
				['AMRAP', labels.kindAmrap],
				['STRENGTH', labels.kindStrength],
				['FOR_TIME', labels.kindForTime]
			] as [k, label] (k)}
				<button
					type="button"
					onclick={() => (kind = k as typeof kind)}
					class="rounded-md px-3 py-1.5 text-xs font-semibold {kind === k
						? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
						: 'border border-[var(--color-border)] text-[var(--color-muted)]'}"
				>
					{label}
				</button>
			{/each}
		</div>

		{#if kind === 'AMRAP'}
			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
					{labels.rounds}
					<Input
						id="result-rounds"
						name="rounds"
						type="number"
						min={0}
						value={existing?.rounds != null ? String(existing.rounds) : ''}
					/>
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
					{labels.reps}
					<Input
						id="result-reps"
						name="reps"
						type="number"
						min={0}
						value={existing?.reps != null ? String(existing.reps) : ''}
					/>
				</label>
			</div>
		{/if}

		{#if kind === 'STRENGTH'}
			<label class="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
				{labels.weightKg}
				<Input
					id="result-weight"
					name="weight_kg"
					type="number"
					min={0}
					step="0.5"
					value={existing?.weight_kg != null ? String(existing.weight_kg) : ''}
				/>
			</label>
		{/if}

		{#if kind === 'FOR_TIME'}
			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
					{labels.minutes}
					<Input
						id="result-mins"
						name="time_minutes"
						type="number"
						min={0}
						value={existingMins !== '' ? String(existingMins) : ''}
					/>
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium text-[var(--color-muted)]">
					{labels.seconds}
					<Input
						id="result-secs"
						name="time_seconds_part"
						type="number"
						min={0}
						max={59}
						value={existingSecs !== '' ? String(existingSecs) : ''}
					/>
				</label>
			</div>
		{/if}

		{#if error}
			<p class="text-sm text-[var(--color-danger)]">{error}</p>
		{/if}

		<Button type="submit" disabled={pending}>{labels.saveResult}</Button>
	</form>
</Dialog>
