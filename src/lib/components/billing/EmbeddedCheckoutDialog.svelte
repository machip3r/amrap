<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import EmbeddedCheckoutMount from '$lib/components/organization/EmbeddedCheckoutMount.svelte';

	type Props = {
		clientSecret: string | null;
		publishableKey: string | null;
		title: string;
		description: string;
		mountLabel: string;
		loadError: string;
		closeLabel: string;
		onClose: () => void;
	};

	let {
		clientSecret,
		publishableKey,
		title,
		description,
		mountLabel,
		loadError,
		closeLabel,
		onClose
	}: Props = $props();
</script>

<Dialog
	open={clientSecret != null}
	onOpenChange={(open) => {
		if (!open) onClose();
	}}
	{title}
	{description}
	{closeLabel}
	fullScreen={true}
	bodyClass="px-3 py-3 sm:px-6 sm:py-4"
	autoFocus={false}
>
	{#if clientSecret && publishableKey}
		<EmbeddedCheckoutMount
			{clientSecret}
			{publishableKey}
			{mountLabel}
			{loadError}
		/>
	{:else if clientSecret && !publishableKey}
		<p class="text-sm text-[var(--color-danger)]" role="alert">{loadError}</p>
	{/if}
</Dialog>
