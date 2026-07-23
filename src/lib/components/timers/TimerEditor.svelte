<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import {
		blankComplexRoutine,
		blankSimpleRoutine,
		createFromTemplate,
		TEMPLATE_OPTIONS,
		type TemplateId
	} from '$lib/timers/templates';
	import { segmentBarParts, totalSeconds } from '$lib/timers/timeline';
	import {
		TIMER_COLORS,
		formatClock,
		newId,
		type TimerCycle,
		type TimerPhase,
		type TimerRoutine
	} from '$lib/timers/types';

	type Labels = Dictionary['timers'];

	type Props = {
		initial: TimerRoutine | null;
		labels: Labels;
		closeLabel: string;
		onCancel: () => void;
		onSave: (routine: TimerRoutine) => void;
	};

	let { initial, labels, closeLabel, onCancel, onSave }: Props = $props();

	function ensureSimplePhases(r: TimerRoutine): TimerPhase[] {
		if (r.phases && r.phases.length >= 4) return r.phases;
		const base = blankSimpleRoutine().phases!;
		return base.map((p) => {
			const existing = r.phases?.find((x) => x.kind === p.kind);
			return existing ?? p;
		});
	}

	const seed = initial;
	let draft = $state(
		seed
			? {
					...seed,
					phases: seed.type === 'simple' ? ensureSimplePhases(seed) : seed.phases
				}
			: blankSimpleRoutine()
	);

	const total = $derived(totalSeconds(draft));
	const bar = $derived(segmentBarParts(draft));
	const canSave = $derived(total > 0);
	const isComplex = $derived(draft.type === 'complex');
	const phases = $derived(draft.type === 'simple' ? ensureSimplePhases(draft) : []);
	const warmup = $derived(phases.find((p) => p.kind === 'warmup'));
	const work = $derived(phases.find((p) => p.kind === 'work'));
	const rest = $derived(phases.find((p) => p.kind === 'rest'));
	const cooldown = $derived(phases.find((p) => p.kind === 'cooldown'));
	const cycles = $derived(draft.cycles ?? []);

	function setPhaseSeconds(kind: TimerPhase['kind'], seconds: number) {
		const nextPhases = ensureSimplePhases(draft).map((p) =>
			p.kind === kind ? { ...p, seconds } : p
		);
		draft = { ...draft, phases: nextPhases, templateId: undefined };
	}

	function applyTemplate(id: TemplateId) {
		const t = createFromTemplate(id);
		draft = {
			...t,
			id: draft.id,
			name: !initial || !draft.name.trim() ? t.name : draft.name,
			updatedAt: draft.updatedAt
		};
	}

	function switchType(type: 'simple' | 'complex') {
		if (type === draft.type) return;
		if (type === 'simple') {
			const s = blankSimpleRoutine();
			draft = {
				...s,
				id: draft.id,
				name: draft.name,
				color: draft.color,
				updatedAt: draft.updatedAt,
				templateId: undefined
			};
		} else {
			const c = blankComplexRoutine();
			draft = {
				...c,
				id: draft.id,
				name: draft.name,
				color: draft.color,
				updatedAt: draft.updatedAt,
				templateId: undefined
			};
		}
	}

	function updateCycle(cycleId: string, patch: Partial<TimerCycle>) {
		draft = {
			...draft,
			templateId: undefined,
			cycles: (draft.cycles ?? []).map((c) => (c.id === cycleId ? { ...c, ...patch } : c))
		};
	}

	function updateCyclePhase(cycleId: string, phaseId: string, seconds: number) {
		draft = {
			...draft,
			templateId: undefined,
			cycles: (draft.cycles ?? []).map((c) =>
				c.id !== cycleId
					? c
					: {
							...c,
							phases: c.phases.map((p) => (p.id === phaseId ? { ...p, seconds } : p))
						}
			)
		};
	}

	function addCycle() {
		const cycle: TimerCycle = {
			id: newId(),
			sets: 1,
			phases: [
				{ id: newId(), kind: 'work', label: 'High Intensity', seconds: 20 },
				{ id: newId(), kind: 'rest', label: 'Low Intensity', seconds: 10 }
			]
		};
		draft = {
			...draft,
			templateId: undefined,
			cycles: [...(draft.cycles ?? []), cycle]
		};
	}

	function removeCycle(cycleId: string) {
		draft = {
			...draft,
			templateId: undefined,
			cycles: (draft.cycles ?? []).filter((c) => c.id !== cycleId)
		};
	}

	function timeParts(seconds: number) {
		return { mins: Math.floor(seconds / 60), secs: seconds % 60 };
	}
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)] pt-[var(--safe-top)]">
	<header
		class="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-[var(--spacing-page)] py-2 backdrop-blur-sm sm:px-[var(--spacing-page-md)] lg:px-[var(--spacing-page-x-lg)]"
	>
		<button
			type="button"
			onclick={onCancel}
			class="min-h-11 min-w-11 px-1 text-sm font-semibold text-[var(--color-primary)]"
		>
			{closeLabel}
		</button>
		<h2 class="truncate font-title text-base font-bold text-[var(--color-text)] sm:text-lg">
			{initial ? labels.editTitle : labels.createTitle}
		</h2>
		<Button
			type="button"
			disabled={!canSave}
			class="h-10 shrink-0 px-4 text-sm shadow-sm"
			onclick={() =>
				onSave({
					...draft,
					name: draft.name.trim() || labels.unnamed
				})}
		>
			{labels.save}
		</Button>
	</header>

	<div
		class="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col sm:px-[var(--spacing-page-md)]"
	>
		<div
			class="min-h-0 flex-1 space-y-3 overflow-y-auto px-[var(--spacing-page)] py-3 sm:px-0"
		>
			<section class="space-y-2">
				<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{labels.namePlaceholder}
				</p>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<div class="flex flex-wrap gap-2">
						{#each TIMER_COLORS as c (c)}
							<button
								type="button"
								onclick={() => (draft = { ...draft, color: c, templateId: undefined })}
								class="h-10 w-10 rounded-lg border-2 {draft.color === c
									? 'border-[var(--color-text)]'
									: 'border-transparent opacity-80'}"
								style:background-color={c}
								aria-label={c}
								aria-pressed={draft.color === c}
							></button>
						{/each}
					</div>
					<Input
						id="timer-name"
						name="name"
						bind:value={draft.name}
						placeholder={labels.namePlaceholder}
						class="min-h-11 flex-1"
						oninput={() => (draft = { ...draft, templateId: undefined })}
					/>
				</div>
			</section>

			<section class="space-y-1.5">
				<div
					class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
				>
					<span class="text-sm font-semibold text-[var(--color-text)]">{labels.type}</span>
					<div
						class="inline-flex rounded-lg bg-[var(--color-surface-hover)] p-0.5"
						role="group"
						aria-label={labels.type}
					>
						{#each ['simple', 'complex'] as t (t)}
							<button
								type="button"
								onclick={() => switchType(t as 'simple' | 'complex')}
								class="min-h-10 rounded-md px-3.5 text-sm font-bold {draft.type === t
									? 'bg-[var(--color-text)] text-[var(--color-bg)]'
									: 'text-[var(--color-muted)]'}"
								aria-pressed={draft.type === t}
							>
								{t === 'simple' ? labels.typeSimple : labels.typeComplex}
							</button>
						{/each}
					</div>
				</div>
				<p class="px-0.5 text-xs text-[var(--color-muted)]">
					{isComplex ? labels.typeComplexHint : labels.typeSimpleHint}
				</p>
			</section>

			<section class="space-y-1.5">
				<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{labels.template}
				</p>
				<div class="flex flex-wrap gap-2" class:opacity-60={isComplex}>
					{#each TEMPLATE_OPTIONS as o (o.id)}
						{@const active = draft.templateId === o.id}
						<button
							type="button"
							onclick={() => applyTemplate(o.id)}
							class="min-h-10 rounded-full px-3.5 text-sm font-semibold {active
								? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
								: 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'}"
						>
							{labels[o.nameKey]}
						</button>
					{/each}
				</div>
				{#if isComplex}
					<p class="text-xs text-[var(--color-muted)]">{labels.templateSimpleOnly}</p>
				{/if}
			</section>

			{#if !isComplex}
				<div
					class="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
				>
					<ul class="divide-y divide-[var(--color-border)]">
						<li class="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
							<span class="text-sm font-medium sm:text-base">{labels.phaseWarmup}</span>
							{@render timePill(warmup?.seconds ?? 0, 'bg-amber-500', (s) =>
								setPhaseSeconds('warmup', s))}
						</li>
						<li
							class="flex min-h-12 items-center justify-between gap-3 bg-[var(--color-surface-hover)]/50 px-4 py-2.5"
						>
							<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
								>{labels.intervalCycle}</span
							>
							<label class="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
								{labels.sets}
								<input
									type="number"
									inputmode="numeric"
									min={1}
									max={99}
									value={draft.repeatSets ?? 1}
									onchange={(e) =>
										(draft = {
											...draft,
											templateId: undefined,
											repeatSets: Math.max(1, Number(e.currentTarget.value) || 1)
										})}
									class="min-h-10 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-base font-semibold tabular-nums text-[var(--color-text)]"
								/>
							</label>
						</li>
						<li class="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
							<span class="text-sm font-medium sm:text-base">{labels.phaseWork}</span>
							{@render timePill(work?.seconds ?? 0, 'bg-rose-600', (s) =>
								setPhaseSeconds('work', s))}
						</li>
						<li class="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
							<span class="text-sm font-medium sm:text-base">{labels.phaseRest}</span>
							{@render timePill(rest?.seconds ?? 0, 'bg-green-600', (s) =>
								setPhaseSeconds('rest', s))}
						</li>
						<li class="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
							<span class="text-sm font-medium sm:text-base">{labels.phaseCooldown}</span>
							{@render timePill(cooldown?.seconds ?? 0, 'bg-blue-600', (s) =>
								setPhaseSeconds('cooldown', s))}
						</li>
					</ul>
				</div>
			{:else}
				<div class="space-y-2.5">
					<div
						class="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
					>
						<span class="text-sm font-medium sm:text-base">{labels.phaseWarmup}</span>
						{@render timePill(draft.warmupSeconds ?? 0, 'bg-amber-500', (s) =>
							(draft = { ...draft, warmupSeconds: s, templateId: undefined }))}
					</div>

					{#each cycles as cycle, idx (cycle.id)}
						<div
							class="overflow-hidden rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)]"
						>
							<div
								class="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/60 px-3 py-2.5 sm:px-4"
							>
								<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
									{labels.intervalCycle}
									{idx + 1}
								</span>
								<div class="flex items-center gap-1.5">
									<label
										class="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]"
									>
										{labels.sets}
										<input
											type="number"
											inputmode="numeric"
											min={1}
											max={99}
											value={cycle.sets}
											onchange={(e) =>
												updateCycle(cycle.id, {
													sets: Math.max(1, Number(e.currentTarget.value) || 1)
												})}
											class="min-h-10 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-base font-semibold tabular-nums text-[var(--color-text)]"
										/>
									</label>
									{#if cycles.length > 1}
										<button
											type="button"
											onclick={() => removeCycle(cycle.id)}
											class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
											aria-label={labels.delete}
										>
											<X class="h-4 w-4" />
										</button>
									{/if}
								</div>
							</div>
							<ul class="divide-y divide-[var(--color-border)]">
								{#each cycle.phases as p (p.id)}
									<li class="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
										<span class="text-sm font-medium sm:text-base">
											{p.kind === 'work' ? labels.phaseWork : labels.phaseRest}
										</span>
										{@render timePill(
											p.seconds,
											p.kind === 'work' ? 'bg-rose-600' : 'bg-green-600',
											(s) => updateCyclePhase(cycle.id, p.id, s)
										)}
									</li>
								{/each}
							</ul>
						</div>
					{/each}

					<button
						type="button"
						onclick={addCycle}
						class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-600/40 bg-green-500/5 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-500/10"
					>
						<Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
						{labels.addCycle}
					</button>

					<div
						class="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
					>
						<span class="text-sm font-medium sm:text-base">{labels.phaseCooldown}</span>
						{@render timePill(draft.cooldownSeconds ?? 0, 'bg-blue-600', (s) =>
							(draft = { ...draft, cooldownSeconds: s, templateId: undefined }))}
					</div>
				</div>
			{/if}
		</div>

		<footer
			class="shrink-0 space-y-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--spacing-page)] py-3 pb-[max(0.75rem,var(--safe-bottom))] sm:rounded-t-xl sm:border sm:border-b-0 sm:px-4"
		>
			<p class="text-center text-base font-semibold tabular-nums text-[var(--color-text)]">
				{labels.total}: {formatClock(total)}
			</p>
			<div class="flex h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
				{#if bar.length === 0 || total <= 0}
					<div class="h-full w-full bg-[var(--color-border)]"></div>
				{:else}
					{#each bar as part, i (`${part.kind}-${i}`)}
						<div
							class="h-full"
							style:width={`${(part.seconds / total) * 100}%`}
							style:background-color={part.color}
						></div>
					{/each}
				{/if}
			</div>
			{#if !canSave}
				<p class="text-center text-xs text-[var(--color-muted)]">{labels.needDuration}</p>
			{/if}
		</footer>
	</div>
</div>

{#snippet timePill(seconds: number, colorClass: string, onChange: (sec: number) => void)}
	{@const parts = timeParts(seconds)}
	<div class="inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-1.5 {colorClass}">
		<input
			type="number"
			inputmode="numeric"
			min={0}
			max={99}
			value={parts.mins}
			onchange={(e) => {
				const m = Math.max(0, Number(e.currentTarget.value) || 0);
				onChange(m * 60 + parts.secs);
			}}
			class="w-9 bg-transparent text-center text-base font-bold tabular-nums text-white outline-none"
			aria-label={labels.minutes}
		/>
		<span class="text-base font-bold text-white/85">:</span>
		<input
			type="number"
			inputmode="numeric"
			min={0}
			max={59}
			value={parts.secs}
			onchange={(e) => {
				const s = Math.min(59, Math.max(0, Number(e.currentTarget.value) || 0));
				onChange(parts.mins * 60 + s);
			}}
			class="w-9 bg-transparent text-center text-base font-bold tabular-nums text-white outline-none"
			aria-label={labels.seconds}
		/>
	</div>
{/snippet}
