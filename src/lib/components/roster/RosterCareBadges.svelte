<script lang="ts">
	import AlertTriangle from '@lucide/svelte/icons/triangle-alert';
	import Cake from '@lucide/svelte/icons/cake';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import type { Dictionary } from '$lib/i18n/dictionaries';

	type Labels = Dictionary['roster'] & { close: string };

	type Props = {
		medicalNote: string | null;
		isFirstDay: boolean;
		isBirthday: boolean;
		labels: Labels;
	};

	let { medicalNote, isFirstDay, isBirthday, labels }: Props = $props();

	let medicalOpen = $state(false);
	const hasMedical = $derived(Boolean(medicalNote?.trim()));
</script>

{#if hasMedical || isFirstDay || isBirthday}
	<span class="inline-flex items-center gap-1">
		{#if hasMedical}
			<button
				type="button"
				onclick={() => (medicalOpen = true)}
				class="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-700 hover:bg-amber-500/15"
				title={labels.medical}
				aria-label={labels.medical}
			>
				<AlertTriangle class="h-4 w-4" aria-hidden="true" />
			</button>
		{/if}
		{#if isFirstDay}
			<span
				class="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-primary)]"
				title={labels.firstDay}
				aria-label={labels.firstDay}
			>
				<Sparkles class="h-4 w-4" aria-hidden="true" />
			</span>
		{/if}
		{#if isBirthday}
			<span
				class="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-600"
				title={labels.birthday}
				aria-label={labels.birthday}
			>
				<Cake class="h-4 w-4" aria-hidden="true" />
			</span>
		{/if}
	</span>

	<Dialog
		open={medicalOpen}
		onOpenChange={(open) => (medicalOpen = open)}
		title={labels.medical}
		closeLabel={labels.close}
	>
		<p class="whitespace-pre-wrap text-sm text-[var(--color-text)]">
			{medicalNote?.trim() || labels.noMedicalNote}
		</p>
	</Dialog>
{/if}
