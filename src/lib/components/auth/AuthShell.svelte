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

<div
	class="auth-container flex min-h-dvh flex-col items-center justify-center overflow-y-auto px-[var(--spacing-page)] py-4 sm:px-6 sm:py-6"
>
	<div
		class="glass-panel animate-fade-in-up my-auto flex w-full max-w-md flex-col items-center rounded-2xl p-5 shadow-2xl sm:p-10"
	>
		<div class="mb-5 flex flex-col items-center text-center sm:mb-8">
			<div class="mb-4 flex w-full justify-center sm:mb-5">
				<a href="/{locale}" aria-label="AMRAP">
					<AmrapLogo class="h-12 w-auto sm:h-16" />
				</a>
			</div>
			<h1 class="text-xl font-bold tracking-tight text-[var(--color-text)] sm:text-2xl">{title}</h1>
			<p class="mt-1.5 text-sm text-[var(--color-muted)] sm:mt-2">{subtitle}</p>
		</div>
		{@render children()}
	</div>
</div>
