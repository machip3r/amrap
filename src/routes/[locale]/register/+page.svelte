<script lang="ts">
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
	import ConfirmEmailForm from '$lib/components/auth/ConfirmEmailForm.svelte';
	import type { ConfirmEmailState } from '$lib/server/auth/confirm-email';
	import type { RegisterState } from '$lib/server/auth/register';

	let { data, form } = $props();
</script>

<AuthShell
	locale={data.locale}
	d={data.d}
	title={data.showConfirm ? data.d.confirmEmail.title : data.d.register.title}
	subtitle={data.showConfirm ? data.d.confirmEmail.subtitle : data.d.register.subtitle}
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
