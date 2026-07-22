<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data } = $props();

	const active = $derived(data.member.gyms.find((g) => g.gymId === data.member.activeGymId));
</script>

<svelte:head>
	<title>{brandedTitle(data.d.member.home, data.documentBrand)}</title>
</svelte:head>

<div class="flex w-full animate-fade-in-up flex-col gap-5">
	<header>
		<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
			{data.d.member.home}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">
			{data.member.fullName ?? data.d.member.title}
			{#if active}
				· {active.gymName}
			{/if}
		</p>
	</header>

	<section
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	>
		<h2 class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
			{data.d.member.gyms}
		</h2>
		<ul class="mt-3 flex flex-col gap-2">
			{#each data.member.gyms as g (g.gymId)}
				<li
					class="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 {g.gymId ===
					data.member.activeGymId
						? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
						: 'border-[var(--color-border)]'}"
				>
					<div class="min-w-0">
						<p class="font-semibold text-[var(--color-text)]">{g.gymName}</p>
						<p class="text-xs text-[var(--color-muted)]">
							{data.d.member.activeUntil}
							{new Date(g.expiresAt).toLocaleDateString(
								data.locale === 'es' ? 'es-MX' : 'en-US'
							)}
						</p>
					</div>
					{#if g.gymId !== data.member.activeGymId}
						<form method="POST" action="?/switchGym">
							<input type="hidden" name="locale" value={data.locale} />
							<input type="hidden" name="gym_id" value={g.gymId} />
							<Button type="submit" variant="toolbarSecondary" class="h-9 min-h-9 px-3 text-xs">
								{data.d.member.switchGym}
							</Button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<nav class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each [
			[`/${data.locale}/me/classes`, data.d.member.classes],
			[`/${data.locale}/me/inbox`, data.d.member.inbox],
			[`/${data.locale}/me/timers`, data.d.member.timers],
			[`/${data.locale}/me/profile`, data.d.member.profile]
		] as [href, label] (href)}
			<a
				{href}
				class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-center font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)]"
			>
				{label}
			</a>
		{/each}
	</nav>
</div>
