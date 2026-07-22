<script lang="ts">
	import FeedbackComposeForm from '$lib/components/feedback/FeedbackComposeForm.svelte';
	import QrCodeImage from '$lib/components/QrCodeImage.svelte';
	import { brandedTitle } from '$lib/seo/document-title';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const d = $derived(data.d);
</script>

<svelte:head>
	<title>{brandedTitle(d.member.profile, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-5">
	<header
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex min-w-0 items-center gap-4">
				<span
					class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]"
				>
					{(data.member.fullName ?? '?').charAt(0).toUpperCase()}
				</span>
				<div class="min-w-0">
					<h1 class="font-title truncate text-3xl font-bold tracking-tight text-[var(--color-text)]">
						{data.member.fullName ?? d.member.profile}
					</h1>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.member.profileSubtitle}</p>
					{#if data.gymName}
						<p class="mt-2 text-sm font-medium text-[var(--color-text)]">{data.gymName}</p>
					{/if}
				</div>
			</div>
			{#if data.qrCode}
				<div
					class="flex shrink-0 flex-col items-center gap-2 self-center sm:items-end sm:self-auto"
					aria-label={d.member.qr}
				>
					<QrCodeImage
						value={data.qrCode}
						size={96}
						alt={d.member.qr}
						class="rounded-lg border border-[var(--color-border)] bg-white p-1.5 shadow-sm"
					/>
					<p class="max-w-[6.5rem] truncate text-center font-mono text-[10px] font-semibold text-[var(--color-muted)] sm:text-right">
						{data.qrCode}
					</p>
				</div>
			{/if}
		</div>
	</header>

	<FeedbackComposeForm
		locale={data.locale}
		{d}
		gymName={data.gymName || d.member.gyms}
		{form}
	/>
</div>
