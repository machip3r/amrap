<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';

	type MemberOpt = { personId: string; name: string };

	type Props = {
		locale: Locale;
		sessionId: string;
		members: MemberOpt[];
		bookedPersonIds: string[];
		labels: {
			bookMember: string;
			selectMember: string;
			book: string;
		};
	};

	let { locale, sessionId, members, bookedPersonIds, labels }: Props = $props();

	const available = $derived(members.filter((m) => !bookedPersonIds.includes(m.personId)));
	let error = $state<string | null>(null);
	let pending = $state(false);
</script>

{#if available.length > 0}
	<form
		method="POST"
		action="?/bookMember"
		class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
		use:enhance={() => {
			pending = true;
			error = null;
			return async ({ result, update }) => {
				pending = false;
				if (result.type === 'success' && result.data && typeof result.data === 'object') {
					const data = result.data as { error?: string };
					if (data.error) error = data.error;
				}
				await update();
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="session_id" value={sessionId} />
		<p class="text-sm font-semibold text-[var(--color-text)]">{labels.bookMember}</p>
		<select
			name="person_id"
			required
			class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
			value=""
		>
			<option value="" disabled>{labels.selectMember}</option>
			{#each available as m (m.personId)}
				<option value={m.personId}>{m.name}</option>
			{/each}
		</select>
		{#if error}
			<p class="text-sm text-[var(--color-primary)]" role="alert">{error}</p>
		{/if}
		<Button type="submit" disabled={pending} class="self-start">{labels.book}</Button>
	</form>
{/if}
