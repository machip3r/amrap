<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';

	type Props = {
		locale: Locale;
		d: Dictionary;
		title: string;
		subtitle: string;
		children: Snippet;
	};

	let { locale, d, title, subtitle, children }: Props = $props();
</script>

<div class="auth-container flex min-h-screen flex-col items-center justify-center p-6">
	<div
		class="glass-panel animate-fade-in-up flex w-full max-w-md flex-col items-center rounded-2xl p-8 shadow-2xl sm:p-10"
	>
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="mb-5 flex w-full justify-center">
				<a href="/{locale}" aria-label="AMRAP">
					<AmrapLogo class="h-14 w-auto sm:h-16" />
				</a>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
			<p class="mt-2 text-sm text-[var(--color-muted)]">{subtitle}</p>
		</div>
		{@render children()}
	</div>
</div>
