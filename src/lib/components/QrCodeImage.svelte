<script lang="ts">
	import QRCode from 'qrcode';

	type Props = {
		value: string;
		size?: number;
		alt?: string;
		class?: string;
	};

	let { value, size = 220, alt = '', class: className = '' }: Props = $props();

	let src = $state(null as string | null);

	$effect(() => {
		let cancelled = false;
		const currentValue = value;
		const currentSize = size;
		src = null;
		void QRCode.toDataURL(currentValue, {
			width: currentSize,
			margin: 1,
			color: { dark: '#1A1A1A', light: '#FFFFFF' }
		}).then((url) => {
			if (!cancelled) src = url;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

{#if !src}
	<div
		class="aspect-square animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] {className}"
		style={className.includes('w-') ? undefined : `width:${size}px;height:${size}px`}
		aria-hidden="true"
	></div>
{:else}
	<img
		{src}
		{alt}
		width={size}
		height={size}
		class="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm {className}"
	/>
{/if}
