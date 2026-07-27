<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import {
		GYM_WEEKDAYS,
		DEFAULT_GYM_SCHEDULE_DAYS,
		DEFAULT_GYM_OPEN_TIME,
		DEFAULT_GYM_CLOSE_TIME,
		formatGymTimeInput,
		type GymWeekday
	} from '$lib/gym/schedule';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { brandedTitle } from '$lib/seo/document-title';
	import { LIMITS } from '$lib/validation/schemas';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const d = $derived(data.d!);

	let saving = $state(false);
	let flash = $state<string | undefined>(undefined);

	$effect(() => {
		if (form?.success) flash = d.gymInfo.saved;
		else if (form?.error) flash = form.error;
		else flash = undefined;
	});

	// Schedule state
	const scheduleDayTokens = GYM_WEEKDAYS;
	const scheduleDayLabels = $derived([
		d.gymInfo.scheduleDayMon,
		d.gymInfo.scheduleDayTue,
		d.gymInfo.scheduleDayWed,
		d.gymInfo.scheduleDayThu,
		d.gymInfo.scheduleDayFri,
		d.gymInfo.scheduleDaySat,
		d.gymInfo.scheduleDaySun
	]);

	const initDays: GymWeekday[] =
		!data.forbidden && data.scheduleEnabledDays && data.scheduleEnabledDays.length > 0
			? (data.scheduleEnabledDays as GymWeekday[])
			: DEFAULT_GYM_SCHEDULE_DAYS;

	let selectedDays = $state(new Set<GymWeekday>(initDays));
	let openTime = $state(
		!data.forbidden ? formatGymTimeInput(data.scheduleOpenTime) ?? DEFAULT_GYM_OPEN_TIME : DEFAULT_GYM_OPEN_TIME
	);
	let closeTime = $state(
		!data.forbidden ? formatGymTimeInput(data.scheduleCloseTime) ?? DEFAULT_GYM_CLOSE_TIME : DEFAULT_GYM_CLOSE_TIME
	);

	function toggleDay(day: GymWeekday) {
		const next = new Set(selectedDays);
		if (next.has(day)) next.delete(day);
		else next.add(day);
		selectedDays = next;
	}
</script>

<svelte:head>
	<title>{brandedTitle(d.gymInfo.title, data.documentBrand)}</title>
</svelte:head>

{#if data.forbidden}
	<p class="text-[var(--color-muted)]">{d.common.forbidden}</p>
{:else}
	<div class="w-full animate-fade-in-up">
		<div>
			<a
				href={`/${data.locale}/organization`}
				class="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
			>
				<ArrowLeft class="h-4 w-4" aria-hidden="true" />
				{d.common.back}
			</a>
		</div>

		<header class="mb-5 mt-1">
			<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
				{d.gymInfo.title}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{d.gymInfo.subtitle}</p>
		</header>

		{#if flash}
			<p
				class="mb-4 rounded-lg border px-4 py-3 text-sm font-medium {form?.success
					? 'border-[var(--color-success)]/25 bg-[var(--color-success)]/10 text-[var(--color-success)]'
					: 'border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'}"
				role="status"
			>
				{flash}
			</p>
		{/if}

		<form
			method="POST"
			action="?/save"
			class="flex flex-col gap-5"
			novalidate
			use:enhance={() => {
				saving = true;
				flash = undefined;
				return async ({ update }) => {
					saving = false;
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="locale" value={data.locale} />
			{#if data.branchId}
				<input type="hidden" name="branchId" value={data.branchId} />
			{/if}

			<section class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
				<h2 class="font-title mb-4 text-xl font-bold text-[var(--color-text)]">{d.gymInfo.title}</h2>
				<div class="flex flex-col gap-4">
					<FormField
						label={d.gymInfo.gymName}
						htmlFor="gi-gym-name"
						error={form?.fieldErrors?.gymName}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="gi-gym-name"
								required
								name="gymName"
								value={data.gymName}
								placeholder={d.gymInfo.gymNamePlaceholder}
								maxlength={LIMITS.entityName}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<FormField
						label={d.gymInfo.gymAddress}
						htmlFor="gi-gym-address"
						error={form?.fieldErrors?.gymAddress}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="gi-gym-address"
								name="gymAddress"
								value={data.gymAddress}
								placeholder={d.gymInfo.gymAddressPlaceholder}
								maxlength={LIMITS.address}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<FormField
						label={d.gymInfo.branchName}
						htmlFor="gi-branch-name"
						error={form?.fieldErrors?.branchName}
					>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="gi-branch-name"
								name="branchName"
								value={data.branchName}
								placeholder={d.gymInfo.branchNamePlaceholder}
								maxlength={LIMITS.entityName}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
				</div>
			</section>

			<section class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
				<div class="mb-4">
					<h2 class="font-title text-xl font-bold text-[var(--color-text)]">{d.gymInfo.scheduleSection}</h2>
					<p class="mt-1 text-sm text-[var(--color-muted)]">{d.gymInfo.scheduleHint}</p>
				</div>

				<div class="flex flex-col gap-4">
					<fieldset>
						<legend class="mb-2 text-sm font-medium text-[var(--color-text)]">{d.gymInfo.scheduleDaysLegend}</legend>
						<div
							class="grid grid-cols-7 gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1.5"
							role="group"
							aria-label={d.gymInfo.scheduleDaysLegend}
						>
							{#each scheduleDayTokens as token, i (token)}
								{@const on = selectedDays.has(token)}
								<button
									type="button"
									aria-pressed={on}
									onclick={() => toggleDay(token)}
									class="flex min-h-11 items-center justify-center rounded-md px-0.5 text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:text-xs {on
										? 'bg-[var(--color-primary)] text-[var(--color-primary-on)] shadow-sm'
										: 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'}"
								>
									{scheduleDayLabels[i]}
								</button>
							{/each}
						</div>
						{#each [...selectedDays] as day (day)}
							<input type="hidden" name="schedule_days" value={day} />
						{/each}
						{#if form?.fieldErrors?.schedule_days}
							<p class="mt-1.5 text-sm text-[var(--color-primary)]" role="alert">{form.fieldErrors.schedule_days}</p>
						{/if}
					</fieldset>

					<div class="grid grid-cols-2 gap-3">
						<FormField
							label={d.gymInfo.scheduleOpenTime}
							htmlFor="gi-open-time"
							error={form?.fieldErrors?.schedule_open_time}
						>
							{#snippet children({ invalid, describedBy })}
								<Input
									id="gi-open-time"
									name="schedule_open_time"
									type="time"
									required
									bind:value={openTime}
									{invalid}
									{describedBy}
								/>
							{/snippet}
						</FormField>
						<FormField
							label={d.gymInfo.scheduleCloseTime}
							htmlFor="gi-close-time"
							error={form?.fieldErrors?.schedule_close_time}
						>
							{#snippet children({ invalid, describedBy })}
								<Input
									id="gi-close-time"
									name="schedule_close_time"
									type="time"
									required
									bind:value={closeTime}
									{invalid}
									{describedBy}
								/>
							{/snippet}
						</FormField>
					</div>
				</div>
			</section>

			<div class="flex justify-end">
				<Button type="submit" disabled={saving}>
					{saving ? d.gymInfo.saving : d.gymInfo.save}
				</Button>
			</div>
		</form>
	</div>
{/if}
