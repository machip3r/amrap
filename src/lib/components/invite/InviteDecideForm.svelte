<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { InviteDecideState } from '$lib/server/invite/actions';

	type Props = {
		locale: Locale;
		d: Dictionary;
		form: InviteDecideState;
	};

	let { locale, d, form }: Props = $props();

	let acceptPending = $state(false);
	let declinePending = $state(false);
	const pending = $derived(acceptPending || declinePending);
</script>

<div class="flex flex-col gap-4">
	{#if form?.error}
		<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{form.error}</p>
	{/if}
	<form
		method="POST"
		action="?/accept"
		use:enhance={() => {
			acceptPending = true;
			return async ({ update }) => {
				acceptPending = false;
				await update();
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<Button type="submit" class="w-full" disabled={pending}>
			{acceptPending ? d.invite.accepting : d.invite.accept}
		</Button>
	</form>
	<form
		method="POST"
		action="?/decline"
		use:enhance={() => {
			declinePending = true;
			return async ({ update }) => {
				declinePending = false;
				await update();
			};
		}}
	>
		<input type="hidden" name="locale" value={locale} />
		<Button type="submit" variant="ghost" class="w-full" disabled={pending}>
			{declinePending ? d.invite.declining : d.invite.decline}
		</Button>
	</form>
</div>
