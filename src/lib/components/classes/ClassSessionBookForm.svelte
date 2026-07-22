<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
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
			searchMember: string;
			bookHint: string;
			noMemberMatches: string;
			book: string;
		};
	};

	let { locale, sessionId, members, bookedPersonIds, labels }: Props = $props();

	const available = $derived(members.filter((m) => !bookedPersonIds.includes(m.personId)));
	let query = $state('');
	let personId = $state('');
	let error = $state<string | null>(null);
	let pending = $state(false);

	const filtered = $derived(
		available.filter((m) => {
			const q = query.trim().toLowerCase();
			if (!q) return true;
			return m.name.toLowerCase().includes(q);
		})
	);

	$effect(() => {
		if (personId && !available.some((m) => m.personId === personId)) {
			personId = '';
		}
	});

	$effect(() => {
		if (personId && !filtered.some((m) => m.personId === personId)) {
			personId = '';
		}
	});
</script>

{#if available.length > 0}
	<section
		class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
	>
		<div class="mb-4">
			<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{labels.bookMember}</h2>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.bookHint}</p>
		</div>

		<div class="mb-3">
			<label class="flex flex-col gap-1.5">
				<span class="text-sm font-medium text-[var(--color-text)]">{labels.searchMember}</span>
				<Input
					id="session-book-search"
					name="session_book_search"
					type="search"
					autocomplete="off"
					bind:value={query}
					placeholder={labels.searchMember}
				/>
			</label>
		</div>

		<form
			method="POST"
			action="?/bookMember"
			class="flex flex-col gap-3"
			use:enhance={() => {
				pending = true;
				error = null;
				return async ({ result, update }) => {
					pending = false;
					if (result.type === 'success' && result.data && typeof result.data === 'object') {
						const data = result.data as { error?: string };
						if (data.error) error = data.error;
						else {
							personId = '';
							query = '';
						}
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="session_id" value={sessionId} />

			<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
				<label class="flex min-w-0 flex-1 flex-col gap-1.5">
					<span class="text-sm font-medium text-[var(--color-text)]">{labels.selectMember}</span>
					<Select
						id="session-book-member"
						name="person_id"
						required
						bind:value={personId}
						invalid={Boolean(error)}
					>
						<option value="" disabled>{labels.selectMember}</option>
						{#each filtered as m (m.personId)}
							<option value={m.personId}>{m.name}</option>
						{/each}
					</Select>
				</label>
				<Button
					type="submit"
					variant="toolbar"
					disabled={pending || !personId}
					class="w-full shrink-0 sm:w-auto"
				>
					{pending ? `${labels.book}…` : labels.book}
				</Button>
			</div>

			{#if query.trim() && filtered.length === 0}
				<p class="text-sm text-[var(--color-muted)]">{labels.noMemberMatches}</p>
			{/if}
			{#if error}
				<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{error}</p>
			{/if}
		</form>
	</section>
{/if}
