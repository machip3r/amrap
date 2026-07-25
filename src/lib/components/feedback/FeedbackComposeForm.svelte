<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { FeedbackFormState } from '$lib/server/feedback/actions';

	type Props = {
		locale: Locale;
		d: Dictionary;
		gymName: string;
		action?: string;
		form?: FeedbackFormState;
	};

	let { locale, d, gymName, action = '?/feedback', form = null }: Props = $props();

	let target = $state<'GYM' | 'AMRAP'>('GYM');
	let body = $state('');
	let pending = $state(false);
	let localForm = $state<FeedbackFormState>(form);

	$effect(() => {
		localForm = form;
	});

	const labels = $derived(d.member);
	const canSubmit = $derived(body.trim().length > 0 && !pending);

	const targetCardClass =
		'group relative flex min-h-[var(--touch-target)] cursor-pointer flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary-soft)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-ring)]';
</script>

<form
	method="POST"
	{action}
	class="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
	use:enhance={() => {
		pending = true;
		localForm = null;
		return async ({ result, update }) => {
			pending = false;
			if (result.type === 'success' && result.data && typeof result.data === 'object') {
				localForm = result.data as FeedbackFormState;
				if ((result.data as FeedbackFormState)?.success) {
					body = '';
					target = 'GYM';
				}
			}
			await update({ reset: false });
		};
	}}
>
	<input type="hidden" name="locale" value={locale} />
	<div>
		<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{labels.feedbackTitle}</h2>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.feedbackHint}</p>
	</div>

	<fieldset class="flex flex-col gap-3">
		<legend class="text-sm font-semibold text-[var(--color-text)]">
			{labels.feedbackTargetLegend}
		</legend>
		<div
			class="grid grid-cols-1 gap-2 sm:grid-cols-2"
			role="radiogroup"
			aria-label={labels.feedbackTargetLegend}
		>
			<label class={targetCardClass}>
				<input type="radio" name="target" value="GYM" bind:group={target} class="sr-only" />
				<span class="flex items-start gap-2.5">
					<span
						class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] group-has-[:checked]:border-[var(--color-primary)]"
						aria-hidden="true"
					>
						<span
							class="h-2.5 w-2.5 rounded-full bg-transparent group-has-[:checked]:bg-[var(--color-primary)]"
						></span>
					</span>
					<span class="min-w-0">
						<span
							class="block text-sm font-semibold text-[var(--color-text)] group-has-[:checked]:text-[var(--color-primary)]"
						>
							{labels.feedbackTargetGym}
						</span>
						<span class="mt-0.5 block truncate text-xs leading-snug text-[var(--color-muted)]">
							{gymName}
						</span>
					</span>
				</span>
			</label>
			<label class={targetCardClass}>
				<input type="radio" name="target" value="AMRAP" bind:group={target} class="sr-only" />
				<span class="flex items-start gap-2.5">
					<span
						class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] group-has-[:checked]:border-[var(--color-primary)]"
						aria-hidden="true"
					>
						<span
							class="h-2.5 w-2.5 rounded-full bg-transparent group-has-[:checked]:bg-[var(--color-primary)]"
						></span>
					</span>
					<span class="min-w-0">
						<span
							class="block text-sm font-semibold text-[var(--color-text)] group-has-[:checked]:text-[var(--color-primary)]"
						>
							{labels.feedbackTargetAmrap}
						</span>
						<span class="mt-0.5 block text-xs leading-snug text-[var(--color-muted)]">
							{labels.feedbackTargetAmrapHint}
						</span>
					</span>
				</span>
			</label>
		</div>
	</fieldset>

	<FormField
		label={labels.feedbackBody}
		htmlFor="feedback-body"
		error={localForm?.fieldErrors?.body}
	>
		{#snippet children({ invalid, describedBy })}
			<textarea
				id="feedback-body"
				name="body"
				rows="4"
				maxlength={4000}
				required
				bind:value={body}
				placeholder={labels.feedbackBodyPlaceholder}
				aria-invalid={invalid || undefined}
				aria-describedby={describedBy}
				class="box-border min-h-[6.5rem] w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-base text-[var(--color-text)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
			></textarea>
		{/snippet}
	</FormField>

	{#if localForm?.error}
		<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{localForm.error}</p>
	{/if}
	{#if localForm?.success}
		<p class="text-sm font-medium text-[var(--color-success)]" role="status">{labels.feedbackSuccess}</p>
	{/if}

	<div class="flex justify-end pt-1">
		<Button type="submit" variant="toolbar" disabled={!canSubmit} class="w-full sm:w-auto">
			{pending ? labels.feedbackSubmitting : labels.feedbackSubmit}
		</Button>
	</div>
</form>
