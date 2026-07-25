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
		defaultGender?: string | null;
		defaultHeightCm?: number | null;
		defaultWeightKg?: number | null;
		form: WelcomeActionState;
	};

	let {
		locale,
		d,
		role,
		defaultDateOfBirth = '',
		defaultGender = '',
		defaultHeightCm = null,
		defaultWeightKg = null,
		form
	}: Props = $props();

	const isMember = $derived(role === 'member');
	const dobMax = maxDateOfBirthIso();
	const dobMin = minDateOfBirthIso();

	let dob = $state(defaultDateOfBirth ?? '');
	let gender = $state(defaultGender ?? '');
	let height = $state(defaultHeightCm != null ? String(defaultHeightCm) : '');
	let weight = $state(defaultWeightKg != null ? String(defaultWeightKg) : '');
	let pending = $state(false);

	/** Digits + optional single decimal (comma → dot). */
	function sanitizeDecimalInput(raw: string): string {
		let out = '';
		let seenDot = false;
		for (const ch of raw.replaceAll(',', '.')) {
			if (ch >= '0' && ch <= '9') {
				out += ch;
			} else if (ch === '.' && !seenDot) {
				out += '.';
				seenDot = true;
			}
		}
		return out;
	}

	function onDecimalInput(
		event: Event,
		set: (value: string) => void
	) {
		const el = event.currentTarget as HTMLInputElement;
		const next = sanitizeDecimalInput(el.value);
		if (el.value !== next) el.value = next;
		set(next);
	}

	const canSubmit = $derived(
		isMember
			? dob.trim().length > 0 &&
					gender.trim().length > 0 &&
					height.trim().length > 0 &&
					Number.isFinite(Number(height)) &&
					weight.trim().length > 0 &&
					Number.isFinite(Number(weight)) &&
					!pending
			: dob.trim().length > 0 && !pending
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
			try {
				await update({ reset: false });
			} finally {
				pending = false;
			}
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
		<FormField label={d.welcome.gender} htmlFor="gender" error={form?.fieldErrors?.gender}>
			{#snippet children({ invalid, describedBy })}
				<Select id="gender" name="gender" required bind:value={gender} {invalid} {describedBy}>
					<option value="" disabled>{d.welcome.gender}</option>
					<option value="MALE">{d.welcome.genderMale}</option>
					<option value="FEMALE">{d.welcome.genderFemale}</option>
					<option value="OTHER">{d.welcome.genderOther}</option>
					<option value="PREFER_NOT">{d.welcome.genderPreferNot}</option>
				</Select>
			{/snippet}
		</FormField>
		<div class="grid gap-4 sm:grid-cols-2">
			<FormField label={d.welcome.heightCm} htmlFor="height" error={form?.fieldErrors?.height_cm}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="height"
						name="height_cm"
						type="text"
						inputmode="decimal"
						autocomplete="off"
						required
						bind:value={height}
						oninput={(e) => onDecimalInput(e, (v) => (height = v))}
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
						type="text"
						inputmode="decimal"
						autocomplete="off"
						required
						bind:value={weight}
						oninput={(e) => onDecimalInput(e, (v) => (weight = v))}
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
