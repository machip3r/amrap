<script lang="ts">
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import ConfirmEmailForm from '$lib/components/auth/ConfirmEmailForm.svelte';
	import SeoHead from '$lib/components/seo/SeoHead.svelte';
	import { localePath } from '$lib/seo/site';
	import type { ConfirmEmailState } from '$lib/server/auth/confirm-email';
	import type { LoginState } from '$lib/server/auth/login';

	let { data, form } = $props();

	const pageTitle = $derived(
		data.showConfirm ? data.d.confirmEmail.title : data.d.login.title
	);
	const pageDescription = $derived(
		data.showConfirm ? data.d.confirmEmail.subtitle : data.d.login.subtitle
	);
	const seoTitle = $derived(
		data.showConfirm
			? `${data.d.confirmEmail.title} — AMRAP`
			: data.locale === 'es'
				? 'Iniciar sesión | AMRAP — software para gimnasios'
				: 'Log in | AMRAP — gym management software'
	);
	const seoDescription = $derived(
		data.showConfirm
			? data.d.confirmEmail.subtitle
			: data.locale === 'es'
				? 'Entra a AMRAP (amrap.space) para gestionar check-in QR, membresías, clases y la recepción de tu gimnasio.'
				: 'Sign in to AMRAP (amrap.space) to run QR check-in, memberships, classes, and your gym front desk.'
	);
</script>

<SeoHead
	locale={data.locale}
	title={seoTitle}
	description={seoDescription}
	path={localePath(data.locale, 'login')}
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
			from="login"
		/>
	{:else}
		<LoginForm locale={data.locale} d={data.d} form={(form as LoginState) ?? null} />
	{/if}
</AuthShell>
