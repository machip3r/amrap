<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import DigitInput from '$lib/components/ui/DigitInput.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import {
		PHASE_KIND_COLOR,
		PHASE_KIND_CUE,
		TIMER_COLORS,
		formatClock,
		resolvePhaseColor,
		resolvePhaseCue,
		type PhaseKind,
		type TimerPhaseCue
	} from '$lib/timers/types';
	import { LIMITS } from '$lib/validation/schemas';
	import { unlockTimerAudio, playPhaseCue } from '$lib/timers/sound';

	type Labels = Dictionary['timers'];

	export type PhaseEditValue = {
		seconds: number;
		color: string;
		cue: TimerPhaseCue;
	};

	type Props = {
		open: boolean;
		title: string;
		kind: PhaseKind;
		seconds: number;
		color?: string;
		cue?: TimerPhaseCue;
		labels: Labels;
		closeLabel: string;
		onOpenChange: (open: boolean) => void;
		onSave: (next: PhaseEditValue) => void;
	};

	let {
		open,
		title,
		kind,
		seconds,
		color = undefined,
		cue = undefined,
		labels,
		closeLabel,
		onOpenChange,
		onSave
	}: Props = $props();

	let draftSeconds = $state(0);
	let draftColor = $state(PHASE_KIND_COLOR.warmup);
	let draftCue = $state<TimerPhaseCue>('none');

	$effect(() => {
		if (!open) return;
		draftSeconds = seconds;
		draftColor = resolvePhaseColor(kind, color);
		draftCue = resolvePhaseCue(kind, cue);
	});

	const mins = $derived(Math.floor(draftSeconds / 60));
	const secs = $derived(draftSeconds % 60);

	const swatches = $derived(
		Array.from(new Set([PHASE_KIND_COLOR[kind], ...TIMER_COLORS]))
	);

	function setMinutes(m: number) {
		draftSeconds = m * 60 + secs;
	}

	function setSeconds(s: number) {
		draftSeconds = mins * 60 + s;
	}

	function selectCue(next: TimerPhaseCue) {
		draftCue = next;
		unlockTimerAudio();
		playPhaseCue(next, false);
	}

	function save() {
		onSave({
			seconds: draftSeconds,
			color: draftColor,
			cue: draftCue
		});
		onOpenChange(false);
	}
</script>

<Dialog
	{open}
	onOpenChange={onOpenChange}
	{title}
	{closeLabel}
	fullScreen={true}
	autoFocus={false}
	bodyClass="flex flex-1 flex-col gap-0 p-0"
>
	<div class="flex min-h-0 flex-1 flex-col">
		<ul class="divide-y divide-[var(--color-border)] border-b border-[var(--color-border)] bg-[var(--color-surface)]">
			<li class="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
				<span class="text-sm font-medium text-[var(--color-text)]">{labels.phaseDuration}</span>
				<div class="inline-flex min-h-11 items-center gap-1 rounded-full bg-[var(--color-surface-hover)] px-3 py-1.5">
					<DigitInput
						value={mins}
						min={0}
						max={LIMITS.timerMinutes}
						fallback={0}
						aria-label={labels.minutes}
						class="w-9 bg-transparent text-center text-base font-bold tabular-nums text-[var(--color-text)] outline-none"
						onChange={setMinutes}
					/>
					<span class="text-base font-bold text-[var(--color-muted)]">:</span>
					<DigitInput
						value={secs}
						min={0}
						max={LIMITS.timerSeconds}
						fallback={0}
						aria-label={labels.seconds}
						class="w-9 bg-transparent text-center text-base font-bold tabular-nums text-[var(--color-text)] outline-none"
						onChange={setSeconds}
					/>
				</div>
			</li>
			<li class="flex flex-col gap-3 px-4 py-3">
				<div class="flex items-center justify-between gap-3">
					<span class="text-sm font-medium text-[var(--color-text)]">{labels.phaseColor}</span>
					<span
						class="h-8 w-8 shrink-0 rounded-full border border-[var(--color-border)]"
						style:background-color={draftColor}
						aria-hidden="true"
					></span>
				</div>
				<div class="grid w-full grid-cols-7 gap-2" role="group" aria-label={labels.phaseColor}>
					{#each swatches as c (c)}
						<button
							type="button"
							onclick={() => (draftColor = c)}
							class="h-11 w-full min-h-[var(--touch-target)] rounded-lg border-2 {draftColor === c
								? 'border-[var(--color-text)]'
								: 'border-transparent opacity-80'}"
							style:background-color={c}
							aria-label={c}
							aria-pressed={draftColor === c}
						></button>
					{/each}
				</div>
			</li>
			<li class="flex flex-col gap-2 px-4 py-3">
				<span class="text-sm font-medium text-[var(--color-text)]">{labels.phaseSound}</span>
				<div
					class="grid grid-cols-3 gap-2"
					role="radiogroup"
					aria-label={labels.phaseSound}
				>
					{#each [
						{ id: 'none' as const, label: labels.soundNone },
						{ id: 'once' as const, label: labels.soundOnce },
						{ id: 'twice' as const, label: labels.soundTwice }
					] as opt (opt.id)}
						<button
							type="button"
							role="radio"
							aria-checked={draftCue === opt.id}
							onclick={() => selectCue(opt.id)}
							class="min-h-11 rounded-xl border px-2 text-center text-xs font-semibold sm:text-sm {draftCue ===
							opt.id
								? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
								: 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</li>
		</ul>

		<p class="px-4 pt-3 text-center text-sm tabular-nums text-[var(--color-muted)]">
			{formatClock(draftSeconds)}
		</p>

		<div class="mt-auto flex gap-2 border-t border-[var(--color-border)] p-4 pb-[max(1rem,var(--safe-bottom))]">
			<Button
				type="button"
				variant="toolbarSecondary"
				class="flex-1"
				onclick={() => onOpenChange(false)}
			>
				{closeLabel}
			</Button>
			<Button type="button" variant="primary" class="flex-1" onclick={save}>
				{labels.save}
			</Button>
		</div>
	</div>
</Dialog>
