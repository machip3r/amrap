<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { readBootLogo } from '$lib/branding/boot-logo';

	let { data } = $props();

	const cached = browser ? readBootLogo() : null;
	const logoLight = cached?.light || '/amrap-black-logo.png';
	const logoDark = cached?.dark || cached?.light || '/amrap-white-logo.png';
	const logoAlt = cached?.name || 'AMRAP';

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
				// Full navigation — `goto` can 404 in standalone when a stale SW
				// shell was hydrated for the wrong URL.
				window.location.replace(body.path);
			} catch {
				if (cancelled) return;
				if (attempts >= 3) {
					window.location.replace(data.fallbackPath);
					return;
				}
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
	class="amrap-app-shell flex flex-col items-center justify-center gap-5 overflow-hidden overscroll-none bg-[var(--color-bg)] px-[var(--spacing-page)]"
	role="status"
	aria-busy="true"
	aria-live="polite"
	aria-label={data.booting}
>
	<img
		src={logoLight}
		alt={logoAlt}
		width="120"
		height="32"
		class="h-9 w-auto max-w-[10rem] object-contain dark:hidden"
		decoding="async"
	/>
	<img
		src={logoDark}
		alt=""
		width="120"
		height="32"
		class="hidden h-9 w-auto max-w-[10rem] object-contain dark:block"
		decoding="async"
		aria-hidden="true"
	/>
	<span
		class="inline-block h-7 w-7 animate-spin rounded-full border-[2.5px] border-[var(--color-primary)]/25 border-t-[var(--color-primary)]"
		aria-hidden="true"
	></span>
	<span class="sr-only">{data.booting}</span>
</div>
