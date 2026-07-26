<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';

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
</script>

<Dialog
	{open}
	onOpenChange={(next) => {
		if (!next) onclose();
	}}
	{title}
	{description}
	closeLabel={cancelLabel}
	class="max-w-md"
	containerClass="items-center justify-center p-[var(--spacing-page)] sm:p-6"
	autoFocus={false}
>
	<form
		method="POST"
		{action}
		class="flex flex-col gap-4"
		use:enhance={() => {
			pending = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					await update();
					onclose();
					pending = false;
					return;
				}
				await update({ reset: false });
				onclose();
				pending = false;
			};
		}}
	>
		{@render children()}
		<div class="flex w-full items-center justify-between gap-2">
			<Button
				type="button"
				variant="ghost"
				class="min-h-11 shrink-0 border border-[var(--color-border)] px-4 text-sm font-semibold"
				onclick={onclose}
			>
				{cancelLabel}
			</Button>
			<Button
				type="submit"
				class="min-h-11 shrink-0 bg-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:brightness-95"
				disabled={pending}
			>
				{confirmLabel}
			</Button>
		</div>
	</form>
</Dialog>
