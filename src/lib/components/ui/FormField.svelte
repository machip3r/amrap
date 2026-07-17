<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		htmlFor: string;
		hint?: string;
		error?: string;
		children: Snippet<[{ invalid: boolean; describedBy?: string }]>;
	};

	let { label, htmlFor, hint = undefined, error = undefined, children }: Props = $props();

	const errorId = $derived(`${htmlFor}-error`);
	const invalid = $derived(Boolean(error));
	const describedBy = $derived(invalid ? errorId : undefined);
</script>

<div class="flex flex-col gap-1.5">
	<label for={htmlFor} class="text-sm font-medium text-[var(--color-text)]">{label}</label>
	{#if hint}
		<p class="text-xs text-[var(--color-muted)]">{hint}</p>
	{/if}
	{@render children({ invalid, describedBy })}
	{#if error}
		<p id={errorId} class="text-sm font-medium text-[var(--color-primary)]" role="alert">
			{error}
		</p>
	{/if}
</div>
