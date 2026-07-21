<script lang="ts">
	import { goto } from '$app/navigation';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import type { Locale } from '$lib/i18n/config';
	import { createClient } from '$lib/supabase/client';
	import type { Snippet } from 'svelte';

	type Props = {
		locale: Locale;
		pendingLabel: string;
		class?: string;
		title?: string;
		children: Snippet;
	};

	let {
		locale,
		pendingLabel,
		class: className = 'text-[var(--color-primary)] hover:underline',
		title,
		children
	}: Props = $props();

	let pending = $state(false);

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	async function logout() {
		if (pending) return;
		pending = true;
		try {
			const supabase = createClient();
			await supabase.auth.signOut();
			await goto(`/${locale}/login`);
		} catch {
			pending = false;
		}
	}
</script>

{#if pending}
	<div
		use:portal
		class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-text)]/40 px-6 backdrop-blur-[2px]"
		role="status"
		aria-live="polite"
	>
		<div
			class="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-6 shadow-xl"
		>
			<Loader2 class="h-8 w-8 animate-spin text-[var(--color-primary)]" aria-hidden="true" />
			<p class="text-sm font-semibold text-[var(--color-text)]">{pendingLabel}</p>
		</div>
	</div>
{/if}

<button type="button" onclick={logout} class={className} {title} disabled={pending} aria-busy={pending}>
	{@render children()}
</button>
