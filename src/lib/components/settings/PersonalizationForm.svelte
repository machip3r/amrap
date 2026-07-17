<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Check from '@lucide/svelte/icons/check';
	import Lock from '@lucide/svelte/icons/lock';
	import X from '@lucide/svelte/icons/x';
	import AmrapLogo from '$lib/components/landing/AmrapLogo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import { BRAND_PALETTE_TEMPLATES } from '$lib/branding/palettes';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { SettingsActionState } from '$lib/server/settings/actions';

	type Props = {
		locale: Locale;
		d: Dictionary;
		logoUrlLight: string | null;
		logoUrlDark: string | null;
		canCustomizeBrand: boolean;
	};

	let { locale, d, logoUrlLight, logoUrlDark, canCustomizeBrand }: Props = $props();

	let displayLight = $state<string | null>(null);
	let displayDark = $state<string | null>(null);
	let flash = $state<string | undefined>(undefined);
	let error = $state<string | undefined>(undefined);
	let palettePending = $state(false);
	let logoPending = $state(false);
	let removePending = $state(false);
	let logoFieldError = $state<string | undefined>(undefined);

	let lightHasFile = $state(false);
	let darkHasFile = $state(false);
	let lightPreview = $state<string | null>(null);
	let darkPreview = $state<string | null>(null);
	let lightFileEl: HTMLInputElement | undefined = $state();
	let darkFileEl: HTMLInputElement | undefined = $state();
	let removeMode = $state<'light' | 'dark' | null>(null);

	$effect(() => {
		displayLight = logoUrlLight;
		displayDark = logoUrlDark;
	});

	function clearLightSelection() {
		lightHasFile = false;
		if (lightPreview) URL.revokeObjectURL(lightPreview);
		lightPreview = null;
		if (lightFileEl) lightFileEl.value = '';
	}

	function clearDarkSelection() {
		darkHasFile = false;
		if (darkPreview) URL.revokeObjectURL(darkPreview);
		darkPreview = null;
		if (darkFileEl) darkFileEl.value = '';
	}

	function handleResult(data: SettingsActionState) {
		if (!data) return;
		if (data.success) {
			flash = data.success;
			error = undefined;
			if (data.logoMode === 'light') {
				displayLight = data.logoUrl ?? null;
				clearLightSelection();
			} else if (data.logoMode === 'dark') {
				displayDark = data.logoUrl ?? null;
				clearDarkSelection();
			}
			void invalidateAll();
		}
		if (data.error) error = data.error;
		if (data.fieldErrors?.logo) logoFieldError = data.fieldErrors.logo;
	}

	const lightDisplay = $derived(lightPreview || displayLight);
	const darkDisplay = $derived(darkPreview || displayDark);

	const fileInputClass =
		'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm text-[var(--color-text)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--color-primary-on)]';
</script>

{#if !canCustomizeBrand}
	<div class="flex flex-col gap-5">
		<div>
			<h2 class="font-title text-2xl font-bold text-[var(--color-text)]">
				{d.settings.personalization}
			</h2>
			<p class="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
				{d.settings.personalizationHint}
			</p>
		</div>
		<section
			class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 shadow-sm sm:p-8"
		>
			<div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
				<div
					class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)]/15 text-[var(--color-muted)]"
				>
					<Lock class="h-5 w-5" aria-hidden="true" />
				</div>
				<div class="min-w-0 flex-1">
					<h3 class="font-title text-lg font-bold text-[var(--color-text)]">
						{d.settings.whitelabelLocked}
					</h3>
					<p class="mt-1 text-sm text-[var(--color-muted)]">
						{d.settings.whitelabelLockedHint}
					</p>
				</div>
				<a
					href="/{locale}/organization#subscription"
					class="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] shadow-sm transition-opacity hover:opacity-90"
				>
					{d.settings.upgradeWhitelabel}
				</a>
			</div>
		</section>
	</div>
{:else}
	<div class="relative flex flex-col gap-5">
		<div class="flex items-start justify-between gap-4">
			<div class="min-w-0">
				<h2 class="font-title text-2xl font-bold text-[var(--color-text)]">
					{d.settings.personalization}
				</h2>
				<p class="mt-1 max-w-xl text-sm text-[var(--color-muted)]">
					{d.settings.personalizationHint}
				</p>
			</div>
			{#if flash}
				<p
					class="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]"
					role="status"
				>
					<Check class="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
					{flash}
				</p>
			{/if}
		</div>

		{#if error}
			<p
				class="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)]"
				role="alert"
			>
				{error}
			</p>
		{/if}

		<section
			class="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<h3 class="font-title text-xl font-bold text-[var(--color-text)]">{d.settings.palettes}</h3>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{d.settings.palettesHint}</p>
			<div class="mt-5 grid gap-3 sm:grid-cols-3">
				{#each BRAND_PALETTE_TEMPLATES as tpl (tpl.id)}
					<form
						method="POST"
						action="?/applyPalette"
						class="contents"
						use:enhance={() => {
							palettePending = true;
							flash = undefined;
							error = undefined;
							return async ({ result, update }) => {
								palettePending = false;
								await update();
								if (result.type === 'success') {
									handleResult(result.data as SettingsActionState);
								}
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="paletteId" value={tpl.id} />
						<button
							type="submit"
							disabled={palettePending}
							class="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-left transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
						>
							<span class="text-sm font-semibold text-[var(--color-text)]">
								{d.settings[tpl.nameKey]}
							</span>
							<span class="flex gap-1.5">
								<span
									class="h-7 flex-1 rounded-md"
									style="background:{tpl.light.primary}"
									title={d.settings.lightMode}
								></span>
								<span class="h-7 flex-1 rounded-md" style="background:{tpl.light.bg}"></span>
								<span
									class="h-7 flex-1 rounded-md border border-[var(--color-border)]"
									style="background:{tpl.light.surface}"
								></span>
							</span>
							<span class="flex gap-1.5">
								<span
									class="h-7 flex-1 rounded-md"
									style="background:{tpl.dark.primary}"
									title={d.settings.darkMode}
								></span>
								<span class="h-7 flex-1 rounded-md" style="background:{tpl.dark.bg}"></span>
								<span
									class="h-7 flex-1 rounded-md border border-[var(--color-border)]"
									style="background:{tpl.dark.surface}"
								></span>
							</span>
							<span
								class="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]"
							>
								{palettePending ? d.settings.saving : d.settings.applyPalette}
							</span>
						</button>
					</form>
				{/each}
			</div>
		</section>

		<section
			class="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
		>
			<h3 class="font-title text-xl font-bold text-[var(--color-text)]">{d.settings.logo}</h3>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{d.settings.logoHint}</p>
			<div class="mt-5 grid gap-4 sm:grid-cols-2">
				<div
					class="relative flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
				>
					<div class="flex items-start justify-between gap-2 pr-8">
						<h4 class="text-sm font-semibold text-[var(--color-text)]">{d.settings.logoLight}</h4>
						{#if displayLight && !lightPreview}
							<button
								type="button"
								onclick={() => (removeMode = 'light')}
								disabled={removePending}
								class="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
								aria-label={d.settings.removeLogo}
							>
								<X class="h-4 w-4" aria-hidden="true" />
							</button>
						{/if}
					</div>
					{#if lightDisplay}
						<img
							src={lightDisplay}
							alt=""
							class="h-12 w-auto max-w-[180px] object-contain object-left"
						/>
					{:else}
						<AmrapLogo class="h-12 w-auto max-w-[180px]" />
					{/if}
					<form
						method="POST"
						action="?/uploadLogo"
						enctype="multipart/form-data"
						class="flex flex-col gap-2"
						use:enhance={() => {
							logoPending = true;
							logoFieldError = undefined;
							flash = undefined;
							error = undefined;
							return async ({ result, update }) => {
								logoPending = false;
								await update();
								if (result.type === 'success') {
									handleResult(result.data as SettingsActionState);
								}
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="mode" value="light" />
						<FormField label={d.settings.uploadLogo} htmlFor="logo-light" error={logoFieldError}>
							{#snippet children({ invalid, describedBy })}
								<input
									bind:this={lightFileEl}
									id="logo-light"
									name="logo"
									type="file"
									accept="image/png,image/jpeg,image/webp,image/svg+xml"
									required
									aria-invalid={invalid || undefined}
									aria-describedby={describedBy}
									class={fileInputClass}
									onchange={(e) => {
										const file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
										if (lightPreview) URL.revokeObjectURL(lightPreview);
										lightHasFile = Boolean(file);
										lightPreview = file ? URL.createObjectURL(file) : null;
									}}
								/>
							{/snippet}
						</FormField>
						<Button type="submit" disabled={logoPending || !lightHasFile}>
							{logoPending ? d.settings.saving : d.settings.uploadLogo}
						</Button>
					</form>
				</div>

				<div
					class="relative flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
				>
					<div class="flex items-start justify-between gap-2 pr-8">
						<h4 class="text-sm font-semibold text-[var(--color-text)]">{d.settings.logoDark}</h4>
						{#if displayDark && !darkPreview}
							<button
								type="button"
								onclick={() => (removeMode = 'dark')}
								disabled={removePending}
								class="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
								aria-label={d.settings.removeLogo}
							>
								<X class="h-4 w-4" aria-hidden="true" />
							</button>
						{/if}
					</div>
					{#if darkDisplay}
						<img
							src={darkDisplay}
							alt=""
							class="h-12 w-auto max-w-[180px] object-contain object-left"
						/>
					{:else}
						<AmrapLogo class="h-12 w-auto max-w-[180px]" />
					{/if}
					<form
						method="POST"
						action="?/uploadLogo"
						enctype="multipart/form-data"
						class="flex flex-col gap-2"
						use:enhance={() => {
							logoPending = true;
							logoFieldError = undefined;
							flash = undefined;
							error = undefined;
							return async ({ result, update }) => {
								logoPending = false;
								await update();
								if (result.type === 'success') {
									handleResult(result.data as SettingsActionState);
								}
							};
						}}
					>
						<input type="hidden" name="locale" value={locale} />
						<input type="hidden" name="mode" value="dark" />
						<FormField label={d.settings.uploadLogo} htmlFor="logo-dark" error={logoFieldError}>
							{#snippet children({ invalid, describedBy })}
								<input
									bind:this={darkFileEl}
									id="logo-dark"
									name="logo"
									type="file"
									accept="image/png,image/jpeg,image/webp,image/svg+xml"
									required
									aria-invalid={invalid || undefined}
									aria-describedby={describedBy}
									class={fileInputClass}
									onchange={(e) => {
										const file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
										if (darkPreview) URL.revokeObjectURL(darkPreview);
										darkHasFile = Boolean(file);
										darkPreview = file ? URL.createObjectURL(file) : null;
									}}
								/>
							{/snippet}
						</FormField>
						<Button type="submit" disabled={logoPending || !darkHasFile}>
							{logoPending ? d.settings.saving : d.settings.uploadLogo}
						</Button>
					</form>
				</div>
			</div>
		</section>

		<Dialog
			open={removeMode != null}
			onOpenChange={(open) => {
				if (!open) removeMode = null;
			}}
			title={d.settings.removeLogo}
			description={d.settings.confirmRemoveLogo}
			closeLabel={d.members.cancel}
		>
			{#if removeMode}
				<form
					method="POST"
					action="?/removeLogo"
					class="flex flex-col gap-4"
					use:enhance={() => {
						removePending = true;
						return async ({ result, update }) => {
							removePending = false;
							await update();
							if (result.type === 'success') {
								handleResult(result.data as SettingsActionState);
								removeMode = null;
							}
						};
					}}
				>
					<input type="hidden" name="locale" value={locale} />
					<input type="hidden" name="mode" value={removeMode} />
					<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="ghost"
							class="rounded-lg px-4 py-2.5 text-sm font-semibold"
							onclick={() => (removeMode = null)}
						>
							{d.members.cancel}
						</Button>
						<Button
							type="submit"
							class="bg-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:brightness-95"
							disabled={removePending}
						>
							{d.settings.removeLogo}
						</Button>
					</div>
				</form>
			{/if}
		</Dialog>
	</div>
{/if}
