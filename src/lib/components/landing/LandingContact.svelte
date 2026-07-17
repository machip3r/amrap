<script lang="ts">
	import { PUBLIC_FORMSPREE_FORM_ID } from '$env/static/public';
	import type { LandingDictionary } from '$lib/i18n/landing-dictionaries';
	import {
		LIMITS,
		emailSchema,
		messageSchema,
		personNameSchema,
		sanitizeEmailInput,
		sanitizePersonNameInput
	} from '$lib/validation/contact';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		d: LandingDictionary;
	};

	let { d }: Props = $props();

	const c = $derived(d.contact);
	const nameId = 'landing-contact-name';
	const emailId = 'landing-contact-email';
	const messageId = 'landing-contact-message';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let pending = $state(false);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let fieldErrors = $state<Record<string, string>>({});

	const canSubmit = $derived(
		name.trim().length > 0 && email.trim().length > 0 && message.trim().length > 0
	);

	function formspreeEndpoint() {
		const id = PUBLIC_FORMSPREE_FORM_ID?.trim();
		if (!id) return null;
		return `https://formspree.io/f/${id}`;
	}

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		const nameParsed = personNameSchema.safeParse(name);
		const emailParsed = emailSchema.safeParse(email);
		const messageParsed = messageSchema.safeParse(message);

		const nextErrors: Record<string, string> = {};
		if (!nameParsed.success) nextErrors.name = c.errors.name;
		if (!emailParsed.success) nextErrors.email = c.errors.email;
		if (!messageParsed.success) nextErrors.message = c.errors.message;

		if (Object.keys(nextErrors).length > 0) {
			fieldErrors = nextErrors;
			status = 'error';
			return;
		}

		const endpoint = formspreeEndpoint();
		if (!endpoint) {
			fieldErrors = {};
			status = 'error';
			return;
		}

		fieldErrors = {};
		pending = true;
		status = 'idle';

		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: nameParsed.data,
					email: emailParsed.data,
					message: messageParsed.data,
					_replyto: emailParsed.data,
					_subject: `AMRAP contact — ${nameParsed.data}`
				})
			});

			if (!res.ok) {
				status = 'error';
				return;
			}

			status = 'success';
			name = '';
			email = '';
			message = '';
		} catch {
			status = 'error';
		} finally {
			pending = false;
		}
	}
</script>

<section id="contacto" class="landing-section landing-contact">
	<div class="landing-container">
		<div class="landing-contact-intro">
			<h2 class="font-title landing-section-title landing-contact-title">{c.title}</h2>
			<p class="landing-contact-subtitle">{c.subtitle}</p>
		</div>

		<div class="landing-contact-grid">
			<aside class="landing-contact-details">
				<div class="landing-contact-detail">
					<span class="landing-contact-detail-label">{c.phoneLabel}</span>
					<a href="tel:{d.footer.phone.replace(/\s+/g, '')}" class="landing-contact-detail-value">
						{d.footer.phone}
					</a>
				</div>
				<div class="landing-contact-detail">
					<span class="landing-contact-detail-label">{c.emailLabel}</span>
					<a href="mailto:{d.footer.email}" class="landing-contact-detail-value">
						{d.footer.email}
					</a>
				</div>
				<div class="landing-contact-detail">
					<span class="landing-contact-detail-label">{c.addressLabel}</span>
					<p class="landing-contact-detail-value">{d.footer.address}</p>
				</div>
			</aside>

			<form class="landing-contact-form" onsubmit={onSubmit} novalidate>
				<FormField label={c.name} htmlFor={nameId} error={fieldErrors.name}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id={nameId}
							name="name"
							autocomplete="name"
							bind:value={name}
							placeholder={c.namePlaceholder}
							maxlength={LIMITS.personName}
							required
							{invalid}
							{describedBy}
							oninput={(event) => {
								name = sanitizePersonNameInput((event.currentTarget as HTMLInputElement).value);
								const next = { ...fieldErrors };
								delete next.name;
								fieldErrors = next;
							}}
						/>
					{/snippet}
				</FormField>

				<FormField label={c.email} htmlFor={emailId} error={fieldErrors.email}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id={emailId}
							name="email"
							type="email"
							autocomplete="email"
							inputmode="email"
							spellcheck={false}
							bind:value={email}
							placeholder={c.emailPlaceholder}
							maxlength={LIMITS.email}
							required
							{invalid}
							{describedBy}
							oninput={(event) => {
								email = sanitizeEmailInput((event.currentTarget as HTMLInputElement).value);
								const next = { ...fieldErrors };
								delete next.email;
								fieldErrors = next;
							}}
						/>
					{/snippet}
				</FormField>

				<FormField label={c.message} htmlFor={messageId} error={fieldErrors.message}>
					{#snippet children({ invalid, describedBy })}
						<textarea
							id={messageId}
							name="message"
							rows={5}
							required
							bind:value={message}
							placeholder={c.messagePlaceholder}
							maxlength={LIMITS.message}
							aria-invalid={invalid || undefined}
							aria-describedby={describedBy}
							class="landing-contact-textarea {invalid
								? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
								: ''}"
							oninput={() => {
								const next = { ...fieldErrors };
								delete next.message;
								fieldErrors = next;
							}}
						></textarea>
					{/snippet}
				</FormField>

				{#if status === 'error' && Object.keys(fieldErrors).length === 0}
					<p class="landing-contact-feedback landing-contact-feedback--error" role="alert">
						{c.error}
					</p>
				{/if}
				{#if status === 'success'}
					<p class="landing-contact-feedback landing-contact-feedback--success" role="status">
						{c.success}
					</p>
				{/if}

				<Button
					type="submit"
					class="landing-contact-submit"
					disabled={!canSubmit || pending}
				>
					{pending ? c.submitting : c.submit}
				</Button>
			</form>
		</div>
	</div>
</section>
