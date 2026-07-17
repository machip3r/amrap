<script lang="ts">
	let { data } = $props();

	const active = $derived(data.member.gyms.find((g) => g.gymId === data.member.activeGymId));
</script>

<svelte:head>
	<title>{data.d.member.title} — AMRAP</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<header>
		<h1 class="font-title text-3xl font-bold text-[var(--color-text)]">{data.d.member.title}</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">
			{data.member.fullName ?? data.member.userId.slice(0, 8)}
		</p>
	</header>

	<section class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
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
					<div>
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
							<button
								type="submit"
								class="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-semibold"
							>
								{data.d.member.switchGym}
							</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<nav class="grid gap-3 sm:grid-cols-3">
		{#each [[`/${data.locale}/me/classes`, data.d.member.classes], [`/${data.locale}/me/inbox`, data.d.member.inbox], [`/${data.locale}/me/qr`, data.d.member.qr]] as [href, label] (href)}
			<a
				{href}
				class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 text-center font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
			>
				{label}
			</a>
		{/each}
	</nav>

	{#if active}
		<p class="text-sm text-[var(--color-muted)]">
			{active.gymName} · {data.d.member.activeUntil}
			{new Date(active.expiresAt).toLocaleDateString(data.locale === 'es' ? 'es-MX' : 'en-US')}
		</p>
	{/if}
</div>
