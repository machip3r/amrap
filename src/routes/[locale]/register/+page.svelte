<script lang="ts">
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
	import ConfirmEmailForm from '$lib/components/auth/ConfirmEmailForm.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { localePath } from '$lib/seo/site';
	import type { ConfirmEmailState } from '$lib/server/auth/confirm-email';
	import type { RegisterState } from '$lib/server/auth/register';

	let { data, form } = $props();

	const pageTitle = $derived(
		data.showConfirm ? data.d.confirmEmail.title : data.d.register.title
	);
	const pageDescription = $derived(
		data.showConfirm ? data.d.confirmEmail.subtitle : data.d.register.subtitle
	);
	const seoTitle = $derived(
		data.showConfirm
			? `${data.d.confirmEmail.title} — AMRAP`
			: data.locale === 'es'
				? 'Registrar gym | AMRAP — empieza gratis'
				: 'Register your gym | AMRAP — start free'
	);
	const seoDescription = $derived(
		data.showConfirm
			? data.d.confirmEmail.subtitle
			: data.locale === 'es'
				? 'Crea tu organización en AMRAP: check-in QR, membresías y operación de gym. Sin tarjeta para empezar.'
				: 'Create your organization on AMRAP: QR check-in, memberships, and gym ops. No card required to start.'
	);
</script>

<SeoHead
	locale={data.locale}
	title={seoTitle}
	description={seoDescription}
	path={localePath(data.locale, 'register')}
/>

<AuthShell
	locale={data.locale}
	d={data.d}
	title={pageTitle}
	subtitle={pageDescription}
>
	{#if data.showConfirm && data.pendingEmail}
		<ConfirmEmailForm
			locale={data.locale}
			d={data.d}
			email={data.pendingEmail}
			form={(form as ConfirmEmailState) ?? null}
			from="register"
		/>
	{:else}
		<RegisterForm locale={data.locale} d={data.d} form={(form as RegisterState) ?? null} />
	{/if}
</AuthShell>
