<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import Button from '$lib/components/ui/Button.svelte';
	import DigitInput from '$lib/components/ui/DigitInput.svelte';
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
		PHASE_KIND_COLOR,
		PHASE_KIND_CUE,
		TIMER_COLORS,
		formatClock,
		newId,
		resolvePhaseColor,
		resolvePhaseCue,
		type PhaseKind,
		type TimerCycle,
		type TimerPhase,
		type TimerPhaseCue,
		type TimerRoutine
	} from '$lib/timers/types';
	import { LIMITS, sanitizeTimerNameInput } from '$lib/validation/schemas';
	import TimerPhaseEditDialog, {
		type PhaseEditValue
	} from './TimerPhaseEditDialog.svelte';

	type Labels = Dictionary['timers'];

	type Props = {
		initial: TimerRoutine | null;
		labels: Labels;
		closeLabel: string;
		onCancel: () => void;
		onSave: (routine: TimerRoutine) => void;
	};

	type PhaseEditTarget =
		| { kind: 'simple'; phaseKind: PhaseKind }
		| { kind: 'complexEdge'; edge: 'warmup' | 'cooldown' }
		| { kind: 'cyclePhase'; cycleId: string; phaseId: string };

	let { initial, labels, closeLabel, onCancel, onSave }: Props = $props();

	function ensureSimplePhases(r: TimerRoutine): TimerPhase[] {
		const base = blankSimpleRoutine().phases!;
		return base.map((p) => {
			const existing = r.phases?.find((x) => x.kind === p.kind);
			if (!existing) return p;
			return {
				...p,
				...existing,
				color: resolvePhaseColor(existing.kind, existing.color),
				cue: resolvePhaseCue(existing.kind, existing.cue)
			};
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

	let editTarget = $state<PhaseEditTarget | null>(null);

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
	const repeatEnabled = $derived((draft.repeatSets ?? 1) > 1);

	const editOpen = $derived(editTarget != null);
	const editTitle = $derived.by(() => {
		const t = editTarget;
		if (!t) return '';
		if (t.kind === 'simple') {
			if (t.phaseKind === 'warmup') return labels.phaseWarmup;
			if (t.phaseKind === 'work') return labels.phaseWork;
			if (t.phaseKind === 'rest') return labels.phaseRest;
			return labels.phaseCooldown;
		}
		if (t.kind === 'complexEdge') {
			return t.edge === 'warmup' ? labels.phaseWarmup : labels.phaseCooldown;
		}
		const phase = draft.cycles
			?.find((c) => c.id === t.cycleId)
			?.phases.find((p) => p.id === t.phaseId);
		if (phase?.kind === 'work') return labels.phaseWork;
		if (phase?.kind === 'rest') return labels.phaseRest;
		return phase?.label ?? labels.edit;
	});
	const editKind = $derived.by((): PhaseKind => {
		const t = editTarget;
		if (!t) return 'work';
		if (t.kind === 'simple') return t.phaseKind;
		if (t.kind === 'complexEdge') return t.edge;
		const phase = draft.cycles
			?.find((c) => c.id === t.cycleId)
			?.phases.find((p) => p.id === t.phaseId);
		return phase?.kind ?? 'work';
	});
	const editSeconds = $derived.by(() => {
		const t = editTarget;
		if (!t) return 0;
		if (t.kind === 'simple') {
			return phases.find((p) => p.kind === t.phaseKind)?.seconds ?? 0;
		}
		if (t.kind === 'complexEdge') {
			return t.edge === 'warmup' ? (draft.warmupSeconds ?? 0) : (draft.cooldownSeconds ?? 0);
		}
		return (
			draft.cycles?.find((c) => c.id === t.cycleId)?.phases.find((p) => p.id === t.phaseId)
				?.seconds ?? 0
		);
	});
	const editColor = $derived.by(() => {
		const t = editTarget;
		if (!t) return undefined;
		if (t.kind === 'simple') {
			return phases.find((p) => p.kind === t.phaseKind)?.color;
		}
		if (t.kind === 'complexEdge') {
			return t.edge === 'warmup' ? draft.warmupColor : draft.cooldownColor;
		}
		return draft.cycles
			?.find((c) => c.id === t.cycleId)
			?.phases.find((p) => p.id === t.phaseId)?.color;
	});
	const editCue = $derived.by((): TimerPhaseCue | undefined => {
		const t = editTarget;
		if (!t) return undefined;
		if (t.kind === 'simple') {
			return phases.find((p) => p.kind === t.phaseKind)?.cue;
		}
		if (t.kind === 'complexEdge') {
			return t.edge === 'warmup' ? draft.warmupCue : draft.cooldownCue;
		}
		return draft.cycles
			?.find((c) => c.id === t.cycleId)
			?.phases.find((p) => p.id === t.phaseId)?.cue;
	});

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

	function addCycle() {
		const cycle: TimerCycle = {
			id: newId(),
			sets: 1,
			phases: [
				{
					id: newId(),
					kind: 'work',
					label: 'High Intensity',
					seconds: 20,
					color: PHASE_KIND_COLOR.work,
					cue: PHASE_KIND_CUE.work
				},
				{
					id: newId(),
					kind: 'rest',
					label: 'Low Intensity',
					seconds: 10,
					color: PHASE_KIND_COLOR.rest,
					cue: PHASE_KIND_CUE.rest
				}
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

	function setRepeatEnabled(on: boolean) {
		draft = {
			...draft,
			templateId: undefined,
			repeatSets: on ? Math.max(2, draft.repeatSets ?? 2) : 1
		};
	}

	function onPhaseSave(next: PhaseEditValue) {
		const t = editTarget;
		if (!t) return;
		if (t.kind === 'simple') {
			const nextPhases = ensureSimplePhases(draft).map((p) =>
				p.kind === t.phaseKind
					? { ...p, seconds: next.seconds, color: next.color, cue: next.cue }
					: p
			);
			draft = { ...draft, phases: nextPhases, templateId: undefined };
			return;
		}
		if (t.kind === 'complexEdge') {
			if (t.edge === 'warmup') {
				draft = {
					...draft,
					templateId: undefined,
					warmupSeconds: next.seconds,
					warmupColor: next.color,
					warmupCue: next.cue
				};
			} else {
				draft = {
					...draft,
					templateId: undefined,
					cooldownSeconds: next.seconds,
					cooldownColor: next.color,
					cooldownCue: next.cue
				};
			}
			return;
		}
		draft = {
			...draft,
			templateId: undefined,
			cycles: (draft.cycles ?? []).map((c) =>
				c.id !== t.cycleId
					? c
					: {
							...c,
							phases: c.phases.map((p) =>
								p.id === t.phaseId
									? { ...p, seconds: next.seconds, color: next.color, cue: next.cue }
									: p
							)
						}
			)
		};
	}

	function phaseRowLabel(kind: PhaseKind) {
		if (kind === 'warmup') return labels.phaseWarmup;
		if (kind === 'work') return labels.phaseWork;
		if (kind === 'rest') return labels.phaseRest;
		return labels.phaseCooldown;
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
		class="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col overflow-hidden sm:px-[var(--spacing-page-md)]"
	>
		<div
			class="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-[var(--spacing-page)] py-3 sm:px-0 [-webkit-overflow-scrolling:touch]"
			onfocusin={(e) => {
				const t = e.target;
				if (!(t instanceof HTMLElement)) return;
				if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
				requestAnimationFrame(() => {
					t.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
					window.scrollTo(0, 0);
				});
			}}
		>
			<section class="space-y-2">
				<p class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{labels.namePlaceholder}
				</p>
				<div
					class="grid w-full grid-cols-6 gap-2"
					role="group"
					aria-label={labels.namePlaceholder}
				>
					{#each TIMER_COLORS.filter((c) => c !== '#eab308') as c (c)}
						<button
							type="button"
							onclick={() => (draft = { ...draft, color: c, templateId: undefined })}
							class="h-11 w-full min-h-[var(--touch-target)] rounded-lg border-2 {draft.color === c
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
					maxlength={LIMITS.timerName}
					class="min-h-11 w-full"
					oninput={(e) => {
						const next = sanitizeTimerNameInput((e.currentTarget as HTMLInputElement).value);
						draft = { ...draft, name: next, templateId: undefined };
						(e.currentTarget as HTMLInputElement).value = next;
					}}
				/>
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
						{#each [
							{ phase: warmup, kind: 'warmup' as const },
							{ phase: work, kind: 'work' as const },
							{ phase: rest, kind: 'rest' as const },
							{ phase: cooldown, kind: 'cooldown' as const }
						] as row (row.kind)}
							<li>
								<button
									type="button"
									class="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
									onclick={() => (editTarget = { kind: 'simple', phaseKind: row.kind })}
								>
									<span
										class="h-3.5 w-3.5 shrink-0 rounded-full"
										style:background-color={resolvePhaseColor(row.kind, row.phase?.color)}
										aria-hidden="true"
									></span>
									<span class="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)] sm:text-base"
										>{phaseRowLabel(row.kind)}</span
									>
									<span class="tabular-nums text-sm font-semibold text-[var(--color-muted)]">
										{formatClock(row.phase?.seconds ?? 0)}
									</span>
									<ChevronRight class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
								</button>
							</li>
							{#if row.kind === 'warmup'}
								<li class="bg-[var(--color-surface-hover)]/50 px-4 py-3">
									<div class="flex items-center justify-between gap-3">
										<div class="min-w-0">
											<p class="text-sm font-semibold text-[var(--color-text)]">{labels.repeat}</p>
											<p class="mt-0.5 text-xs text-[var(--color-muted)]">{labels.repeatSetsHint}</p>
										</div>
										<button
											type="button"
											role="switch"
											aria-checked={repeatEnabled}
											aria-label={labels.repeat}
											onclick={() => setRepeatEnabled(!repeatEnabled)}
											class="relative h-8 w-14 shrink-0 rounded-full transition-colors {repeatEnabled
												? 'bg-[var(--color-primary)]'
												: 'bg-[var(--color-border)]'}"
										>
											<span
												class="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform {repeatEnabled
													? 'translate-x-6'
													: 'translate-x-0'}"
											></span>
										</button>
									</div>
									{#if repeatEnabled}
										<label
											class="mt-3 flex items-center justify-between gap-3 text-sm font-medium text-[var(--color-muted)]"
										>
											{labels.sets}
											<DigitInput
												value={draft.repeatSets ?? 2}
												min={2}
												max={LIMITS.timerSets}
												fallback={2}
												aria-label={labels.sets}
												class="min-h-10 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-base font-semibold tabular-nums text-[var(--color-text)]"
												onChange={(sets) =>
													(draft = {
														...draft,
														templateId: undefined,
														repeatSets: sets
													})}
											/>
										</label>
									{/if}
								</li>
							{/if}
						{/each}
					</ul>
				</div>
			{:else}
				<div class="space-y-2.5">
					<button
						type="button"
						class="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
						onclick={() => (editTarget = { kind: 'complexEdge', edge: 'warmup' })}
					>
						<span
							class="h-3.5 w-3.5 shrink-0 rounded-full"
							style:background-color={resolvePhaseColor('warmup', draft.warmupColor)}
							aria-hidden="true"
						></span>
						<span class="min-w-0 flex-1 text-sm font-medium sm:text-base">{labels.phaseWarmup}</span>
						<span class="tabular-nums text-sm font-semibold text-[var(--color-muted)]">
							{formatClock(draft.warmupSeconds ?? 0)}
						</span>
						<ChevronRight class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
					</button>

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
										<DigitInput
											value={cycle.sets}
											min={1}
											max={LIMITS.timerSets}
											fallback={1}
											aria-label={labels.sets}
											class="min-h-10 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-center text-base font-semibold tabular-nums text-[var(--color-text)]"
											onChange={(sets) => updateCycle(cycle.id, { sets })}
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
									<li>
										<button
											type="button"
											class="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
											onclick={() =>
												(editTarget = {
													kind: 'cyclePhase',
													cycleId: cycle.id,
													phaseId: p.id
												})}
										>
											<span
												class="h-3.5 w-3.5 shrink-0 rounded-full"
												style:background-color={resolvePhaseColor(p.kind, p.color)}
												aria-hidden="true"
											></span>
											<span class="min-w-0 flex-1 text-sm font-medium sm:text-base">
												{p.kind === 'work' ? labels.phaseWork : labels.phaseRest}
											</span>
											<span class="tabular-nums text-sm font-semibold text-[var(--color-muted)]">
												{formatClock(p.seconds)}
											</span>
											<ChevronRight
												class="h-4 w-4 shrink-0 text-[var(--color-muted)]"
												aria-hidden="true"
											/>
										</button>
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

					<button
						type="button"
						class="flex min-h-14 w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
						onclick={() => (editTarget = { kind: 'complexEdge', edge: 'cooldown' })}
					>
						<span
							class="h-3.5 w-3.5 shrink-0 rounded-full"
							style:background-color={resolvePhaseColor('cooldown', draft.cooldownColor)}
							aria-hidden="true"
						></span>
						<span class="min-w-0 flex-1 text-sm font-medium sm:text-base">{labels.phaseCooldown}</span>
						<span class="tabular-nums text-sm font-semibold text-[var(--color-muted)]">
							{formatClock(draft.cooldownSeconds ?? 0)}
						</span>
						<ChevronRight class="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
					</button>
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

<TimerPhaseEditDialog
	open={editOpen}
	title={editTitle}
	kind={editKind}
	seconds={editSeconds}
	color={editColor}
	cue={editCue}
	{labels}
	{closeLabel}
	onOpenChange={(open) => {
		if (!open) editTarget = null;
	}}
	onSave={onPhaseSave}
/>
