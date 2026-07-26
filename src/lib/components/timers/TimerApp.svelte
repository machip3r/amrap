<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import { setTimersImmersive } from '$lib/timers/shell.svelte';
	import {
		deleteRoutine,
		getRoutinesSnapshot,
		subscribeRoutines,
		upsertRoutine
	} from '$lib/timers/storage';
	import type { TimerRoutine } from '$lib/timers/types';
	import { attachTimerWakeLockLifecycle } from '$lib/timers/wake-lock';
	import { lockBodyScroll } from '$lib/dom/scroll-lock';
	import PageLoader from '$lib/components/ui/PageLoader.svelte';
	import TimerEditor from './TimerEditor.svelte';
	import TimerRoutinesList from './TimerRoutinesList.svelte';
	import TimerRunScreen from './TimerRunScreen.svelte';

	type View =
		| { kind: 'list' }
		| { kind: 'edit'; routine: TimerRoutine | null }
		| { kind: 'run'; routineId: string };

	type Props = {
		locale: Locale;
	};

	let { locale }: Props = $props();

	const d = $derived(getDictionary(locale));
	const labels = $derived(d.timers);

	let routines = $state<TimerRoutine[]>([]);
	let hydrated = $state(false);
	let view = $state<View>({ kind: 'list' });

	$effect(() => {
		routines = getRoutinesSnapshot();
		hydrated = true;
		return subscribeRoutines(() => {
			routines = getRoutinesSnapshot();
		});
	});

	/** Keep screen awake on any timers surface (list / edit / run). */
	$effect(() => attachTimerWakeLockLifecycle());

	/** Hide ops chrome only while running or editing — do not clear on every view change. */
	$effect(() => {
		setTimersImmersive(view.kind === 'run' || view.kind === 'edit');
	});

	/** Pin document scroll while editing/running so iOS keyboard cannot open a gap below the shell. */
	$effect(() => {
		if (view.kind !== 'run' && view.kind !== 'edit') return;
		return lockBodyScroll();
	});

	onDestroy(() => setTimersImmersive(false));

	const runRoutine = $derived.by(() => {
		const v = view;
		if (v.kind !== 'run') return null;
		return routines.find((r) => r.id === v.routineId) ?? null;
	});
</script>

{#if !hydrated}
	<PageLoader label={d.common.loading} />
{:else if view.kind === 'edit'}
	<div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-bg)]">
		<TimerEditor
			initial={view.routine}
			{labels}
			closeLabel={d.registerUser.close}
			onCancel={() => (view = { kind: 'list' })}
			onSave={(routine) => {
				upsertRoutine(routine);
				view = { kind: 'list' };
			}}
		/>
	</div>
{:else if view.kind === 'run' && runRoutine}
	{#key runRoutine.id}
		<div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
			<TimerRunScreen
				routine={runRoutine}
				{labels}
				onClose={() => (view = { kind: 'list' })}
				onEdit={() => (view = { kind: 'edit', routine: runRoutine })}
			/>
		</div>
	{/key}
{:else}
	<TimerRoutinesList
		{routines}
		{labels}
		onOpen={(id) => (view = { kind: 'run', routineId: id })}
		onEdit={(id) => {
			const r = routines.find((x) => x.id === id) ?? null;
			view = { kind: 'edit', routine: r };
		}}
		onDelete={(id) => {
			if (!window.confirm(labels.deleteConfirm)) return;
			deleteRoutine(id);
		}}
		onCreate={() => (view = { kind: 'edit', routine: null })}
	/>
{/if}
