<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	type Props = {
		open: boolean;
		title: string;
		description?: string;
		cancelLabel: string;
		confirmLabel: string;
		action: string;
		onclose: () => void;
		children: Snippet;
	};

	let {
		open,
		title,
		description = undefined,
		cancelLabel,
		confirmLabel,
		action,
		onclose,
		children
	}: Props = $props();

	let pending = $state(false);
	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
		if (!open && dialogEl.open) dialogEl.close();
	});
</script>

<dialog
	bind:this={dialogEl}
	class="w-[min(100%,28rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl backdrop:bg-black/40"
	onclose={onclose}
>
	<h2 class="text-lg font-bold text-[var(--color-text)]">{title}</h2>
	{#if description}
		<p class="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
	{/if}
	<form
		method="POST"
		{action}
		class="mt-4 flex flex-col gap-4"
		use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				pending = false;
				onclose();
				await update();
			};
		}}
	>
		{@render children()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="ghost" class="rounded-lg px-4 py-2.5 text-sm font-semibold" onclick={onclose}>
				{cancelLabel}
			</Button>
			<Button
				type="submit"
				class="bg-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:brightness-95"
				disabled={pending}
			>
				{confirmLabel}
			</Button>
		</div>
	</form>
</dialog>
