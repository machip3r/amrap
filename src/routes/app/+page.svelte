<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		let cancelled = false;
		let attempts = 0;

		async function resolveAndGo() {
			attempts += 1;
			try {
				const res = await fetch('/app/resolve', {
					credentials: 'same-origin',
					headers: { Accept: 'application/json' }
				});
				if (!res.ok) throw new Error(`resolve ${res.status}`);
				const body = (await res.json()) as { path?: string };
				if (!body.path || typeof body.path !== 'string' || !body.path.startsWith('/')) {
					throw new Error('invalid path');
				}
				if (cancelled) return;
				await goto(body.path, { replaceState: true });
			} catch {
				if (cancelled || attempts >= 3) return;
				window.setTimeout(() => {
					if (!cancelled) void resolveAndGo();
				}, 1200 * attempts);
			}
		}

		void resolveAndGo();
		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
	<title>AMRAP</title>
</svelte:head>

<div
	class="amrap-app-shell flex flex-col items-center justify-center gap-5 bg-[var(--color-bg)] px-[var(--spacing-page)]"
	role="status"
	aria-busy="true"
	aria-live="polite"
	aria-label={data.booting}
>
	<img
		src="/amrap-hero-logo-black.png"
		alt=""
		width="144"
		height="48"
		class="h-auto w-[min(42vw,9rem)] dark:hidden"
		decoding="async"
	/>
	<img
		src="/amrap-hero-logo-white.png"
		alt=""
		width="144"
		height="48"
		class="hidden h-auto w-[min(42vw,9rem)] dark:block"
		decoding="async"
	/>
	<span
		class="inline-block h-7 w-7 animate-spin rounded-full border-[2.5px] border-[var(--color-primary)]/25 border-t-[var(--color-primary)]"
		aria-hidden="true"
	></span>
	<span class="sr-only">{data.booting}</span>
</div>
