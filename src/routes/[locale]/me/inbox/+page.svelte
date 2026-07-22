<script lang="ts">
	import { brandedTitle } from '$lib/seo/document-title';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
	const locale = $derived(data.locale);
</script>

<svelte:head>
	<title>{brandedTitle(d.member.inbox, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-5">
	<header>
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{d.member.inbox}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{d.member.inboxSubtitle}</p>
	</header>

	{#if data.messages.length === 0}
		<section
			class="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-14 text-center"
		>
			<p class="text-sm text-[var(--color-muted)]">{d.member.emptyInbox}</p>
		</section>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.messages as m (m.id)}
				<li
					class="rounded-2xl border px-4 py-3 shadow-sm {m.read_at
						? 'border-[var(--color-border)] bg-[var(--color-surface)]'
						: 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'}"
				>
					<p class="font-semibold text-[var(--color-text)]">{m.title}</p>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{m.body}</p>
					<p class="mt-2 text-xs text-[var(--color-muted)]">
						{new Date(m.created_at).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
