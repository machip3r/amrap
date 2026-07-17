<script lang="ts">
	import type { Locale } from '$lib/i18n/config';
	import { getDictionary } from '$lib/i18n/dictionaries';
	import {
		deleteRoutine,
		getRoutinesSnapshot,
		subscribeRoutines,
		upsertRoutine
	} from '$lib/timers/storage';
	import type { TimerRoutine } from '$lib/timers/types';
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

	const runRoutine = $derived.by(() => {
		const v = view;
		if (v.kind !== 'run') return null;
		return routines.find((r) => r.id === v.routineId) ?? null;
	});
</script>

{#if !hydrated}
	<p class="text-sm text-[var(--color-muted)]">{d.common.loading}</p>
{:else if view.kind === 'edit'}
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
{:else if view.kind === 'run' && runRoutine}
	{#key runRoutine.id}
		<TimerRunScreen
			routine={runRoutine}
			{labels}
			onClose={() => (view = { kind: 'list' })}
			onEdit={() => (view = { kind: 'edit', routine: runRoutine })}
		/>
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
