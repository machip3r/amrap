<script lang="ts">
	import FeedbackComposeForm from '$lib/components/feedback/FeedbackComposeForm.svelte';
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
		<div class="flex items-center gap-4">
			<span
				class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-lg font-bold text-[var(--color-primary)]"
			>
				{(data.fullName ?? '?').charAt(0).toUpperCase()}
			</span>
			<div class="min-w-0">
				<h1 class="font-title truncate text-3xl font-bold tracking-tight text-[var(--color-text)]">
					{data.fullName ?? d.member.profile}
				</h1>
				<p class="mt-1 text-sm text-[var(--color-muted)]">{d.member.profileSubtitle}</p>
				<p class="mt-2 text-sm font-medium text-[var(--color-text)]">{data.gymName}</p>
			</div>
		</div>
	</header>

	{#if data.canCompose}
		<FeedbackComposeForm locale={data.locale} {d} gymName={data.gymName} {form} />
	{:else}
		<section
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<p class="text-sm text-[var(--color-muted)]">{d.member.feedbackForbidden}</p>
			{#if data.canActAsOwner}
				<p class="mt-2 text-sm text-[var(--color-muted)]">
					<a
						href="/{data.locale}/organization"
						class="font-semibold text-[var(--color-primary)] underline"
					>
						{d.organization.feedbackTitle}
					</a>
				</p>
			{/if}
		</section>
	{/if}
</div>
