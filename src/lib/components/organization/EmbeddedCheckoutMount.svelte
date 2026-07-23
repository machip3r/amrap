<script lang="ts">
	import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js';

	type Props = {
		clientSecret: string;
		publishableKey: string;
		mountLabel: string;
		loadError: string;
	};

	let { clientSecret, publishableKey, mountLabel, loadError }: Props = $props();

	let mountEl: HTMLDivElement | undefined = $state();
	let error = $state<string | undefined>(undefined);
	let checkout: StripeEmbeddedCheckout | null = null;

	$effect(() => {
		const secret = clientSecret;
		const key = publishableKey;
		const el = mountEl;
		if (!secret || !key || !el) return;

		let cancelled = false;
		error = undefined;

		(async () => {
			try {
				const stripe = await loadStripe(key);
				if (!stripe || cancelled) return;

				const instance = await stripe.initEmbeddedCheckout({ clientSecret: secret });
				if (cancelled) {
					instance.destroy();
					return;
				}
				checkout = instance;
				instance.mount(el);
			} catch (err) {
				console.error('EmbeddedCheckout mount', err);
				if (!cancelled) error = loadError;
			}
		})();

		return () => {
			cancelled = true;
			checkout?.destroy();
			checkout = null;
		};
	});
</script>

<div class="flex min-h-0 flex-1 flex-col">
	{#if error}
		<p class="px-1 text-sm text-[var(--color-danger)]" role="alert">{error}</p>
	{:else}
		<p class="sr-only">{mountLabel}</p>
	{/if}
	<div bind:this={mountEl} class="min-h-[28rem] w-full flex-1"></div>
</div>
