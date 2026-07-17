<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import QrCodeImage from '$lib/components/QrCodeImage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
	const member = $derived(data.member);

	let copied = $state(false);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(member.qrCode);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			/* ignore */
		}
	}
</script>

<svelte:head>
	<title>{d.member.qr} — AMRAP</title>
</svelte:head>

<div class="flex flex-col items-center gap-6 py-8 text-center">
	<h1 class="font-title text-3xl font-bold text-[var(--color-text)]">{d.member.qr}</h1>
	<p class="max-w-sm text-sm text-[var(--color-muted)]">{d.member.qrHint}</p>
	{#if member.fullName}
		<p class="text-lg font-semibold text-[var(--color-text)]">{member.fullName}</p>
	{/if}
	<QrCodeImage value={member.qrCode} size={220} alt={d.member.qr} class="mx-auto" />
	<div
		class="w-full max-w-md rounded-3xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-6 py-6 shadow-sm"
	>
		<p
			class="break-all font-mono text-2xl font-bold tracking-wide text-[var(--color-text)] sm:text-3xl"
		>
			{member.qrCode}
		</p>
	</div>
	<Button type="button" class="shadow-sm" onclick={copyCode}>
		{copied ? d.member.copiedQr : d.member.copyQr}
	</Button>
</div>
