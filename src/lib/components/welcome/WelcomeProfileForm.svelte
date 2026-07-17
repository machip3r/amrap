<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { WelcomeRole } from '$lib/auth/profile-onboarding';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { WelcomeActionState } from '$lib/server/welcome/actions';
	import { maxDateOfBirthIso, minDateOfBirthIso } from '$lib/validation/schemas';

	type Props = {
		locale: Locale;
		d: Dictionary;
		role: WelcomeRole;
		defaultDateOfBirth?: string | null;
		defaultSex?: string | null;
		defaultHeightCm?: number | null;
		defaultWeightKg?: number | null;
		form: WelcomeActionState;
	};

	let {
		locale,
		d,
		role,
		defaultDateOfBirth = '',
		defaultSex = '',
		defaultHeightCm = null,
		defaultWeightKg = null,
		form
	}: Props = $props();

	const isMember = $derived(role === 'member');
	const dobMax = maxDateOfBirthIso();
	const dobMin = minDateOfBirthIso();

	let dob = $state(defaultDateOfBirth ?? '');
	let sex = $state(defaultSex ?? '');
	let height = $state(defaultHeightCm != null ? String(defaultHeightCm) : '');
	let weight = $state(defaultWeightKg != null ? String(defaultWeightKg) : '');
	let pending = $state(false);

	const canSubmit = $derived(
		isMember
			? dob.length > 0 &&
					sex.length > 0 &&
					height.trim().length > 0 &&
					weight.trim().length > 0 &&
					!pending
			: dob.length > 0 && !pending
	);
</script>

<form
	method="POST"
	action="?/completeProfile"
	class="flex flex-col gap-4"
	novalidate
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			pending = false;
			await update();
		};
	}}
>
	<input type="hidden" name="locale" value={locale} />
	<FormField label={d.welcome.dateOfBirth} htmlFor="dob" error={form?.fieldErrors?.date_of_birth}>
		{#snippet children({ invalid, describedBy })}
			<Input
				id="dob"
				name="date_of_birth"
				type="date"
				required
				min={dobMin}
				max={dobMax}
				bind:value={dob}
				{invalid}
				{describedBy}
			/>
		{/snippet}
	</FormField>

	{#if isMember}
		<FormField label={d.welcome.sex} htmlFor="sex" error={form?.fieldErrors?.sex}>
			{#snippet children({ invalid, describedBy })}
				<Select id="sex" name="sex" required bind:value={sex} {invalid} {describedBy}>
					<option value="" disabled>{d.welcome.sex}</option>
					<option value="male">{d.welcome.sexMale}</option>
					<option value="female">{d.welcome.sexFemale}</option>
					<option value="other">{d.welcome.sexOther}</option>
					<option value="prefer_not">{d.welcome.sexPreferNot}</option>
				</Select>
			{/snippet}
		</FormField>
		<div class="grid gap-4 sm:grid-cols-2">
			<FormField label={d.welcome.heightCm} htmlFor="height" error={form?.fieldErrors?.height_cm}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="height"
						name="height_cm"
						type="number"
						inputmode="decimal"
						required
						min={50}
						max={250}
						step="0.1"
						bind:value={height}
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>
			<FormField label={d.welcome.weightKg} htmlFor="weight" error={form?.fieldErrors?.weight_kg}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="weight"
						name="weight_kg"
						type="number"
						inputmode="decimal"
						required
						min={20}
						max={400}
						step="0.1"
						bind:value={weight}
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>
		</div>
	{/if}

	{#if form?.error}
		<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{form.error}</p>
	{/if}

	<Button type="submit" variant="primaryBlock" disabled={!canSubmit}>
		{pending ? d.welcome.submitting : d.welcome.submit}
	</Button>
</form>
