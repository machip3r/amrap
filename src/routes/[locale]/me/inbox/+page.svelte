<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.d!);
	const locale = $derived(data.locale);
</script>

<svelte:head>
	<title>{d.member.inbox} — AMRAP</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="font-title text-3xl font-bold text-[var(--color-text)]">{d.member.inbox}</h1>
	{#if data.messages.length === 0}
		<p class="text-sm text-[var(--color-muted)]">{d.member.emptyInbox}</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each data.messages as m (m.id)}
				<li
					class="rounded-2xl border px-4 py-3 {m.read_at
						? 'border-[var(--color-border)] bg-[var(--color-surface)]'
						: 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'}"
				>
					<div>
						<p class="font-semibold text-[var(--color-text)]">{m.title}</p>
						<p class="mt-1 text-sm text-[var(--color-muted)]">{m.body}</p>
						<p class="mt-2 text-xs text-[var(--color-muted)]">
							{new Date(m.created_at).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US')}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
