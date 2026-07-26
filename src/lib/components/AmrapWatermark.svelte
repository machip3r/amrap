<script lang="ts">
	import AmrapLogo from "$lib/components/landing/AmrapLogo.svelte";
	import type { Locale } from "$lib/i18n/config";

	type Props = {
		locale: Locale;
		label: string;
		class?: string;
	};

	let { locale, label, class: className = "" }: Props = $props();
</script>

<div
	class="flex items-center justify-center gap-1.5 border-t border-[var(--color-border)] px-4 py-1.5 {className}"
>
	<a
		href="/{locale}"
		class="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
	>
		<span>{label}</span>
		<AmrapLogo class="h-3 w-auto opacity-80" />
	</a>
</div>
