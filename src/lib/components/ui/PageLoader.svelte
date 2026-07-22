<script lang="ts">
	import Loader2 from '@lucide/svelte/icons/loader-2';

	type Props = {
		/** Accessible name (screen readers); not shown visually. */
		label: string;
		class?: string;
	};

	let { label, class: className = '' }: Props = $props();
</script>

<div
	class="flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 py-12 {className}"
	role="status"
	aria-live="polite"
	aria-busy="true"
	aria-label={label}
>
	<span
		class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10"
		aria-hidden="true"
	>
		<Loader2 class="h-6 w-6 animate-spin text-[var(--color-primary)]" />
	</span>
	<span class="sr-only">{label}</span>
</div>
