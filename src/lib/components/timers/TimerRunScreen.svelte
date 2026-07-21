<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Lock from '@lucide/svelte/icons/lock';
	import Pause from '@lucide/svelte/icons/pause';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Play from '@lucide/svelte/icons/play';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Unlock from '@lucide/svelte/icons/unlock';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import X from '@lucide/svelte/icons/x';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import { expandRoutine } from '$lib/timers/timeline';
	import { MUTE_KEY, formatClock, playBeep, type TimerRoutine } from '$lib/timers/types';

	type Labels = Dictionary['timers'];

	type Props = {
		routine: TimerRoutine;
		labels: Labels;
		onClose: () => void;
		onEdit: () => void;
	};

	let { routine, labels, onClose, onEdit }: Props = $props();

	const timeline = $derived(expandRoutine(routine));
	const totalAll = $derived(timeline.reduce((s, t) => s + t.seconds, 0));

	let index = $state(0);
	let running = $state(false);
	let phaseLeft = $state(0);
	let muted = $state(false);
	let locked = $state(false);
	let done = $state(false);

	let endAt: number | null = null;
	let indexRef = 0;
	let timelineRef = timeline;

	$effect(() => {
		timelineRef = timeline;
	});

	$effect(() => {
		indexRef = index;
	});

	$effect(() => {
		// Init phase when routine mounts
		phaseLeft = timeline[0]?.seconds ?? 0;
		try {
			muted = localStorage.getItem(MUTE_KEY) === '1';
		} catch {
			muted = false;
		}
	});

	function goToIndex(next: number, autoStart: boolean) {
		const list = timelineRef;
		if (list.length === 0) return;
		const clamped = Math.max(0, Math.min(list.length - 1, next));
		index = clamped;
		indexRef = clamped;
		done = false;
		const sec = list[clamped]!.seconds;
		phaseLeft = sec;
		if (autoStart) {
			endAt = Date.now() + sec * 1000;
			running = true;
		} else {
			endAt = null;
			running = false;
		}
	}

	$effect(() => {
		if (!running) return;
		const id = window.setInterval(() => {
			if (!endAt) return;
			const left = Math.ceil((endAt - Date.now()) / 1000);
			if (left > 0) {
				phaseLeft = left;
				return;
			}

			const list = timelineRef;
			let mutedNow = false;
			try {
				mutedNow = localStorage.getItem(MUTE_KEY) === '1';
			} catch {
				/* ignore */
			}
			const next = indexRef + 1;
			if (next >= list.length) {
				playBeep('end', mutedNow);
				phaseLeft = 0;
				running = false;
				done = true;
				endAt = null;
				return;
			}
			playBeep(list[next]?.kind === 'rest' ? 'rest' : 'interval', mutedNow);
			goToIndex(next, true);
		}, 200);
		return () => window.clearInterval(id);
	});

	const current = $derived(timeline[index]);
	const completedBefore = $derived(timeline.slice(0, index).reduce((s, t) => s + t.seconds, 0));
	const phaseDuration = $derived(current?.seconds ?? 0);
	const elapsedInPhase = $derived(Math.max(0, phaseDuration - phaseLeft));
	const elapsed = $derived(done ? totalAll : completedBefore + elapsedInPhase);
	const remaining = $derived(Math.max(0, totalAll - elapsed));

	function resetToStart() {
		running = false;
		done = false;
		index = 0;
		indexRef = 0;
		endAt = null;
		phaseLeft = timeline[0]?.seconds ?? 0;
	}

	function start() {
		if (timeline.length === 0) return;
		if (done) resetToStart();
		const left = phaseLeft > 0 ? phaseLeft : (timeline[index]?.seconds ?? 0);
		phaseLeft = left;
		endAt = Date.now() + left * 1000;
		running = true;
		done = false;
		playBeep('start', muted);
	}

	function pause() {
		if (!running || !endAt) return;
		const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
		phaseLeft = left;
		endAt = null;
		running = false;
	}

	function toggleMute() {
		muted = !muted;
		try {
			localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
		} catch {
			/* ignore */
		}
	}

	function guarded(fn: () => void) {
		if (locked) return;
		fn();
	}

	const phaseLabel = $derived(
		done ? labels.phaseDone : current?.label || labels.phaseReady
	);

	const setLabel = $derived(
		current && current.setTotal > 1
			? labels.roundOf
					.replace('{current}', String(current.setIndex))
					.replace('{total}', String(current.setTotal))
			: current
				? labels.setOf
						.replace('{current}', String(current.setIndex))
						.replace('{total}', String(current.setTotal))
				: ''
	);
</script>

<div class="relative flex min-h-0 flex-1 flex-col overflow-hidden text-white" style:background-color={routine.color}>
	<div
		class="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5"
	>
		<button
			type="button"
			onclick={() => guarded(onClose)}
			class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
			aria-label={labels.closeRun}
			disabled={locked}
		>
			<X class="h-7 w-7" aria-hidden="true" />
		</button>
		<h1 class="truncate text-center font-title text-xl font-bold tracking-tight sm:text-2xl">
			{routine.name}
		</h1>
		<div class="flex items-center gap-2 justify-self-end">
			<button
				type="button"
				onclick={() => guarded(onEdit)}
				class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
				aria-label={labels.edit}
				disabled={locked}
			>
				<Pencil class="h-6 w-6" aria-hidden="true" />
			</button>
			<button
				type="button"
				onclick={toggleMute}
				class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
				aria-label={muted ? labels.unmute : labels.mute}
			>
				{#if muted}
					<VolumeX class="h-6 w-6" aria-hidden="true" />
				{:else}
					<Volume2 class="h-6 w-6" aria-hidden="true" />
				{/if}
			</button>
		</div>
	</div>

	<div class="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
		<p class="font-title text-[5.5rem] font-bold leading-none tracking-tight tabular-nums sm:text-[7rem]">
			{formatClock(done ? 0 : phaseLeft)}
		</p>

		<div class="mt-8 flex w-full max-w-md items-center justify-center gap-3 sm:gap-5">
			<button
				type="button"
				disabled={locked || index <= 0}
				onclick={() => goToIndex(index - 1, false)}
				class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
				aria-label={labels.prevPhase}
			>
				<ChevronLeft class="h-8 w-8" aria-hidden="true" />
			</button>
			<div class="min-w-0 flex-1 text-center">
				<p class="truncate text-xl font-semibold sm:text-2xl">{phaseLabel}</p>
				{#if setLabel}
					<p class="mt-1 text-base text-white/80">{setLabel}</p>
				{/if}
			</div>
			<button
				type="button"
				disabled={locked || index >= timeline.length - 1}
				onclick={() => goToIndex(index + 1, running)}
				class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
				aria-label={labels.nextPhase}
			>
				<ChevronRight class="h-8 w-8" aria-hidden="true" />
			</button>
		</div>

		<div class="mt-10 grid w-full max-w-sm grid-cols-2 gap-8 text-center">
			<div>
				<p class="font-title text-3xl font-bold tabular-nums sm:text-4xl">{formatClock(elapsed)}</p>
				<p class="mt-1.5 text-sm font-semibold uppercase tracking-wider text-white/75">
					{labels.elapsed}
				</p>
			</div>
			<div>
				<p class="font-title text-3xl font-bold tabular-nums sm:text-4xl">
					{formatClock(remaining)}
				</p>
				<p class="mt-1.5 text-sm font-semibold uppercase tracking-wider text-white/75">
					{labels.remaining}
				</p>
			</div>
		</div>
	</div>

	<div
		class="flex items-center justify-center gap-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4 sm:gap-8"
	>
		<button
			type="button"
			onclick={() => (locked = !locked)}
			class="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/45 bg-white/10"
			aria-label={locked ? labels.unlock : labels.lock}
			aria-pressed={locked}
		>
			{#if locked}
				<Lock class="h-8 w-8" aria-hidden="true" />
			{:else}
				<Unlock class="h-8 w-8" aria-hidden="true" />
			{/if}
		</button>

		{#if !running}
			<button
				type="button"
				disabled={locked || timeline.length === 0}
				onclick={() => guarded(start)}
				class="inline-flex h-36 w-36 flex-col items-center justify-center rounded-full border-[3px] border-white text-lg font-bold uppercase tracking-wider disabled:opacity-50"
			>
				<Play class="mb-1.5 h-10 w-10 fill-current" aria-hidden="true" />
				{labels.start}
			</button>
		{:else}
			<button
				type="button"
				disabled={locked}
				onclick={() => guarded(pause)}
				class="inline-flex h-36 w-36 flex-col items-center justify-center rounded-full border-[3px] border-white text-lg font-bold uppercase tracking-wider disabled:opacity-50"
			>
				<Pause class="mb-1.5 h-10 w-10 fill-current" aria-hidden="true" />
				{labels.pause}
			</button>
		{/if}

		<button
			type="button"
			disabled={locked}
			onclick={() => guarded(resetToStart)}
			class="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/45 bg-white/10 disabled:opacity-50"
			aria-label={labels.reset}
		>
			<RotateCcw class="h-8 w-8" aria-hidden="true" />
		</button>
	</div>

	{#if locked}
		<p class="pb-4 text-center text-sm text-white/75">{labels.lockedHint}</p>
	{/if}
</div>
