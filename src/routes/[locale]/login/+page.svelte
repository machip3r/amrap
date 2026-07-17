<script lang="ts">
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import ConfirmEmailForm from '$lib/components/auth/ConfirmEmailForm.svelte';
	import type { ConfirmEmailState } from '$lib/server/auth/confirm-email';
	import type { LoginState } from '$lib/server/auth/login';

	let { data, form } = $props();
</script>

<AuthShell
	locale={data.locale}
	d={data.d}
	title={data.showConfirm ? data.d.confirmEmail.title : data.d.login.title}
	subtitle={data.showConfirm ? data.d.confirmEmail.subtitle : data.d.login.subtitle}
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
