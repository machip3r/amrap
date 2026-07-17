<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Locale } from '$lib/i18n/config';
	import { createClient } from '$lib/supabase/client';
	import type { Snippet } from 'svelte';

	type Props = {
		locale: Locale;
		class?: string;
		title?: string;
		children: Snippet;
	};

	let { locale, class: className = 'text-[var(--color-primary)] hover:underline', title, children }: Props =
		$props();

	async function logout() {
		const supabase = createClient();
		await supabase.auth.signOut();
		await goto(`/${locale}/login`);
	}
</script>

<button type="button" onclick={logout} class={className} {title}>
	{@render children()}
</button>
