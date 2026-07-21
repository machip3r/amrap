<script lang="ts">
	import { onDestroy } from 'svelte';
	import { deserialize } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { OPS_LOAD_DEPS } from '$lib/nav/load-deps';
	import {
		ArrowRight,
		Check,
		LoaderCircle,
		Maximize2,
		Minimize2,
		QrCode,
		Search,
		UserRoundCheck,
		X
	} from '@lucide/svelte';
	import type { Html5Qrcode } from 'html5-qrcode';
	import type { Locale } from '$lib/i18n/config';
	import { setCheckinKiosk } from '$lib/checkin/kiosk-shell.svelte';
	import type { CheckInListItem } from '$lib/checkin/queries';
	import type {
		CheckinCandidate,
		CheckinMember,
		CheckinResult,
		SearchCheckInResult
	} from '$lib/server/checkin/actions';
	import { LIMITS } from '$lib/validation/schemas';
	import Input from '$lib/components/ui/Input.svelte';
	import CheckinList from '$lib/components/checkin/CheckinList.svelte';
	import CheckinRegisterButton from '$lib/components/checkin/CheckinRegisterButton.svelte';

	export type CheckinLabels = {
		title: string;
		subtitle: string;
		scanTitle: string;
		scanHint: string;
		manualTitle: string;
		manualLabel: string;
		manualPlaceholder: string;
		lookup: string;
		clear: string;
		scanning: string;
		lookingUp: string;
		stopCamera: string;
		startCamera: string;
		resultOk: string;
		resultDenied: string;
		memberNotFound: string;
		selectMember: string;
		confirmCheckIn: string;
		matchesHint: string;
		active: string;
		expired: string;
		qrInUse: string;
		cameraError: string;
		forbidden: string;
		saveFailed: string;
		accessGranted: string;
		accessDenied: string;
		qrSuccessTitle: string;
		qrSuccessHint: string;
		waitingResult: string;
		waitingResultHint: string;
		expiresIn: string;
		days: string;
		weekAttendance: string;
		noPlan: string;
		nextScan: string;
		classReserved: string;
		walkInTitle: string;
		walkInEnroll: string;
		walkInFull: string;
		noOpenClasses: string;
		todayTitle: string;
		todayEmpty: string;
		viewAllCheckIns: string;
		colMember: string;
		colTime: string;
		colPlan: string;
		colSource: string;
		sourceQr: string;
		sourceManual: string;
		sourceKiosk: string;
		enterKiosk: string;
		exitKiosk: string;
		kioskHint: string;
	};

	type ResultView =
		| { kind: 'idle' }
		| { kind: 'pick'; matches: CheckinCandidate[] }
		| { kind: 'ok'; member: CheckinMember | null; message: string }
		| { kind: 'error'; title: string; message: string };

	type Props = {
		labels: CheckinLabels;
		locale: Locale;
		canManageMembers: boolean;
		canManageStaff: boolean;
		todayCheckIns: CheckInListItem[];
		registerLabel?: string;
		registerPlans?: import('$lib/components/register/RegisterUserDialog.svelte').RegisterPlanOption[];
	};

	let {
		labels,
		locale,
		canManageMembers,
		canManageStaff,
		todayCheckIns,
		registerLabel,
		registerPlans = []
	}: Props = $props();

	let manual = $state('');
	let cameraOn = $state(false);
	let kioskMode = $state(false);
	let resultView = $state<ResultView>({ kind: 'idle' });
	let qrCelebration = $state<{ name: string } | null>(null);
	let pending = $state(false);
	/** True from QR decode until the scan action finishes (shows full-screen loader). */
	let qrProcessing = $state(false);
	let celebrationTimer: ReturnType<typeof setTimeout> | null = null;
	let resultPanelEl: HTMLElement | undefined = $state();

	let scanner: Html5Qrcode | null = null;
	const regionId = `checkin-qr-${Math.random().toString(36).slice(2, 10)}`;

	function kioskFields(extra: Record<string, string> = {}) {
		return kioskMode ? { ...extra, kiosk: '1' } : extra;
	}
	/** Keep overlays on `document.body` so they aren't trapped by page transforms. */
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
		return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
	}

	function daysUntil(iso: string) {
		const ms = new Date(iso).getTime() - Date.now();
		return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
	}

	function dismissQrCelebration() {
		qrCelebration = null;
		if (celebrationTimer) {
			clearTimeout(celebrationTimer);
			celebrationTimer = null;
		}
	}

	function showQrCelebration(name: string) {
		qrCelebration = { name };
		if (celebrationTimer) clearTimeout(celebrationTimer);
		celebrationTimer = setTimeout(() => {
			qrCelebration = null;
			celebrationTimer = null;
		}, 2800);
	}

	function applyResult(r: CheckinResult, opts?: { celebrate?: boolean }) {
		if (r.status === 'ok') {
			resultView = { kind: 'ok', member: r.member, message: labels.resultOk };
			if (opts?.celebrate) {
				showQrCelebration(r.member?.name ?? '');
			}
			void invalidate(OPS_LOAD_DEPS.checkin);
			void invalidate(OPS_LOAD_DEPS.dashboard);
			return;
		}
		const message =
			r.status === 'denied'
				? labels.resultDenied
				: r.status === 'not_found'
					? labels.memberNotFound
					: r.status === 'busy'
						? labels.qrInUse
						: r.status === 'forbidden'
							? labels.forbidden
							: r.status === 'empty'
								? labels.manualPlaceholder
								: labels.saveFailed;
		resultView = {
			kind: 'error',
			title: labels.accessDenied,
			message
		};
	}

	async function postAction<T>(action: string, fields: Record<string, string>): Promise<T | null> {
		const body = new FormData();
		for (const [key, value] of Object.entries(fields)) {
			body.set(key, value);
		}
		const response = await fetch(`?/${action}`, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const actionResult = deserialize(await response.text());
		if (actionResult.type === 'success' || actionResult.type === 'failure') {
			const data = actionResult.data as Record<string, unknown> | undefined;
			return (data?.result as T) ?? null;
		}
		return null;
	}

	async function handleQrCode(code: string) {
		qrProcessing = true;
		pending = true;
		try {
			const r = await postAction<CheckinResult>('scan', kioskFields({ code }));
			if (r) applyResult(r, { celebrate: true });
			else applyResult({ status: 'error' });
		} finally {
			pending = false;
			qrProcessing = false;
			if (kioskMode && !cameraOn) {
				queueMicrotask(() => void startCamera());
			}
		}
	}

	async function handleManualSearch() {
		const q = manual.trim();
		if (!q) return;
		(document.activeElement as HTMLElement | null)?.blur();
		pending = true;
		try {
			const r = await postAction<SearchCheckInResult>('search', { code: q });
			if (!r) {
				resultView = {
					kind: 'error',
					title: labels.accessDenied,
					message: labels.saveFailed
				};
				return;
			}
			if (r.status === 'matches') {
				resultView = { kind: 'pick', matches: r.matches };
				return;
			}
			const message =
				r.status === 'not_found'
					? labels.memberNotFound
					: r.status === 'forbidden'
						? labels.forbidden
						: r.status === 'empty'
							? labels.manualPlaceholder
							: labels.saveFailed;
			resultView = {
				kind: 'error',
				title: labels.accessDenied,
				message
			};
		} finally {
			pending = false;
			queueMicrotask(() => {
				resultPanelEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});
		}
	}

	async function handleSelectCandidate(membershipId: string) {
		pending = true;
		try {
			const r = await postAction<CheckinResult>('confirm', kioskFields({ membershipId }));
			if (r) applyResult(r);
			else applyResult({ status: 'error' });
		} finally {
			pending = false;
		}
	}

	async function enterKiosk() {
		kioskMode = true;
		setCheckinKiosk(true);
		resultView = { kind: 'idle' };
		if (!cameraOn) void startCamera();
	}

	async function exitKiosk() {
		kioskMode = false;
		setCheckinKiosk(false);
		await stopCamera();
	}

	async function startCamera() {
		resultView = { kind: 'idle' };
		try {
			const { Html5Qrcode } = await import('html5-qrcode');
			const next = new Html5Qrcode(regionId);
			scanner = next;
			await next.start(
				{ facingMode: 'environment' },
				{ fps: 8, qrbox: { width: 260, height: 260 } },
				(decoded) => {
					if (qrProcessing || pending) return;
					qrProcessing = true;
					void handleQrCode(decoded);
					void next.stop().then(() => {
						try {
							next.clear();
						} catch {
							/* ignore */
						}
						scanner = null;
						cameraOn = false;
					});
				},
				() => {}
			);
			cameraOn = true;
		} catch {
			resultView = {
				kind: 'error',
				title: labels.accessDenied,
				message: labels.cameraError
			};
			cameraOn = false;
		}
	}

	async function stopCamera() {
		try {
			await scanner?.stop();
			scanner?.clear();
		} catch {
			/* ignore */
		}
		scanner = null;
		cameraOn = false;
	}

	function clearManual() {
		manual = '';
		resultView = { kind: 'idle' };
	}

	async function enrollWalkIn(sessionId: string, personId: string, className: string, startsAt: string) {
		if (resultView.kind !== 'ok' || !resultView.member) return;
		pending = true;
		try {
			const r = await postAction<{ ok: boolean }>('walkIn', { sessionId, personId });
			if (r?.ok && resultView.kind === 'ok' && resultView.member) {
				resultView = {
					kind: 'ok',
					member: {
						...resultView.member,
						classBooking: {
							className,
							startsAt,
							status: 'attended'
						},
						openSessions: resultView.member.openSessions?.map((o) =>
							o.sessionId === sessionId
								? { ...o, hasBooking: true, bookingStatus: 'attended' }
								: o
						)
					},
					message: labels.resultOk
				};
				void invalidate(OPS_LOAD_DEPS.checkin);
				void invalidate(OPS_LOAD_DEPS.dashboard);
			}
		} finally {
			pending = false;
		}
	}

	onDestroy(() => {
		setCheckinKiosk(false);
		void scanner?.stop().catch(() => {});
		try {
			scanner?.clear();
		} catch {
			/* ignore */
		}
		scanner = null;
		if (celebrationTimer) clearTimeout(celebrationTimer);
	});

	const expiresDays = $derived(
		resultView.kind === 'ok' && resultView.member ? daysUntil(resultView.member.expiresAt) : null
	);
</script>

<div
	class="flex w-full min-w-0 flex-col gap-5 overflow-x-hidden {kioskMode
		? 'h-full min-h-0 gap-3 overflow-y-auto p-[var(--spacing-page)] pb-[max(1rem,var(--safe-bottom))] sm:p-[var(--spacing-page-md)]'
		: ''}"
>
	{#if qrProcessing}
		<div
			use:portal
			class="fixed inset-0 z-[70] flex h-dvh w-full flex-col items-center justify-center gap-4 bg-black/70 px-6 text-center backdrop-blur-sm"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<LoaderCircle
				class="h-14 w-14 animate-spin text-[var(--color-primary)] sm:h-16 sm:w-16"
				aria-hidden="true"
			/>
			<p class="font-title text-xl font-semibold text-white sm:text-2xl">{labels.lookingUp}</p>
			<p class="text-sm text-white/70">{labels.scanning}</p>
		</div>
	{/if}

	{#if qrCelebration}
		<button
			type="button"
			use:portal
			aria-label={labels.qrSuccessHint}
			onclick={dismissQrCelebration}
			class="amrap-checkin-success-overlay fixed inset-0 z-[80] flex h-dvh w-full cursor-pointer flex-col items-center justify-center gap-5 bg-black/80 px-6 text-center backdrop-blur-sm"
		>
			<span class="relative inline-flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
				<span
					class="amrap-checkin-success-ring absolute inset-0 rounded-full border-[6px] border-[var(--color-success)]"
					aria-hidden="true"
				></span>
				<span
					class="amrap-checkin-success-mark relative inline-flex h-full w-full items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-lg"
					aria-hidden="true"
				>
					<Check class="h-20 w-20 sm:h-24 sm:w-24" strokeWidth={3} />
				</span>
			</span>
			<div class="amrap-checkin-success-mark flex flex-col gap-2">
				<p class="font-title text-3xl font-bold tracking-tight text-white sm:text-4xl">
					{labels.qrSuccessTitle}
				</p>
				{#if qrCelebration.name}
					<p class="text-lg font-semibold text-white/90 sm:text-xl">{qrCelebration.name}</p>
				{/if}
				<p class="text-sm text-white/65">{labels.qrSuccessHint}</p>
			</div>
		</button>
	{/if}

	<header class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
		<div class="min-w-0">
			<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
				{labels.title}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">
				{kioskMode ? labels.kioskHint : labels.subtitle}
			</p>
		</div>
		<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
			{#if kioskMode}
				<button
					type="button"
					onclick={() => void exitKiosk()}
					class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] sm:w-auto"
				>
					<Minimize2 class="h-4 w-4" aria-hidden="true" />
					{labels.exitKiosk}
				</button>
			{:else}
				<button
					type="button"
					onclick={() => void enterKiosk()}
					class="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-on)] sm:w-auto"
				>
					<Maximize2 class="h-4 w-4" aria-hidden="true" />
					{labels.enterKiosk}
				</button>
				{#if registerLabel && (canManageMembers || canManageStaff)}
					<div class="shrink-0 self-stretch sm:self-auto">
						<CheckinRegisterButton
							{locale}
							{canManageMembers}
							{canManageStaff}
							plans={registerPlans}
							label={registerLabel}
							class="w-full sm:w-auto"
						/>
					</div>
				{/if}
			{/if}
		</div>
	</header>

	<div
		class="grid min-w-0 gap-4 {kioskMode
			? 'min-h-0 flex-1 lg:grid-cols-[1.6fr_1fr]'
			: 'lg:grid-cols-[1.4fr_1fr]'}"
	>		<section
			class="flex min-w-0 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6 {kioskMode
				? 'min-h-0'
				: ''}"
		>
			<h2 class="font-title text-2xl font-bold text-[var(--color-text)]">{labels.scanTitle}</h2>
			<p class="mt-1 max-w-md text-sm text-[var(--color-muted)]">{labels.scanHint}</p>

			<div
				class="relative mx-auto mt-6 flex w-full flex-1 flex-col items-center justify-center {kioskMode
					? 'max-w-xl'
					: 'max-w-md'}"
			>
				<div
					class="relative w-full overflow-hidden rounded-2xl border-2 {cameraOn
						? 'border-[var(--color-primary)] bg-black'
						: 'aspect-square border-[var(--color-border)] bg-[var(--color-bg)]'} {kioskMode &&
					cameraOn
						? 'min-h-[min(52dvh,28rem)]'
						: ''}"
				>
					<div id={regionId} class="checkin-qr-reader w-full"></div>
					{#if !cameraOn}
						<div
							class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-muted)]"
						>
							<QrCode class="h-16 w-16 opacity-35" aria-hidden="true" />
						</div>
					{/if}
					<div
						class="pointer-events-none absolute left-3 top-3 z-10 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-[var(--color-primary)]"
					></div>
					<div
						class="pointer-events-none absolute right-3 top-3 z-10 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-[var(--color-primary)]"
					></div>
					<div
						class="pointer-events-none absolute bottom-3 left-3 z-10 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-[var(--color-primary)]"
					></div>
					<div
						class="pointer-events-none absolute bottom-3 right-3 z-10 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-[var(--color-primary)]"
					></div>
				</div>

				<div class="mt-4 flex w-full flex-wrap items-center justify-center gap-2">
					{#if !cameraOn}
						<button
							type="button"
							onclick={() => void startCamera()}
							class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)]"
						>
							{labels.startCamera}
						</button>
					{:else if !qrProcessing}
						<button
							type="button"
							onclick={() => void stopCamera()}
							class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40"
						>
							{labels.stopCamera}
						</button>
					{/if}
				</div>
			</div>
		</section>

		<div class="flex min-w-0 flex-col gap-4">
			<section
				class="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
			>
				<h2 class="text-sm font-bold uppercase tracking-wider text-[var(--color-text)]">
					{labels.manualTitle}
				</h2>
				<div class="mt-3 flex flex-col gap-3">
					<label class="sr-only" for="checkin-manual">{labels.manualLabel}</label>
					<form
						class="flex flex-col gap-3"
						onsubmit={(e) => {
							e.preventDefault();
							void handleManualSearch();
						}}
					>
						<div class="relative min-w-0">
							<Search
								class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
								aria-hidden="true"
							/>
							<div class="min-w-0 pl-0 [&_input]:pl-10">
								<Input
									id="checkin-manual"
									name="code"
									type="search"
									enterkeyhint="search"
									bind:value={manual}
									placeholder={labels.manualPlaceholder}
									maxlength={LIMITS.checkInCode}
									spellcheck={false}
									disabled={pending}
								/>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<button
								type="button"
								onclick={clearManual}
								class="min-h-11 rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
							>
								{labels.clear}
							</button>
							<button
								type="submit"
								disabled={pending || manual.trim().length === 0}
								class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--color-primary-on)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<Search class="h-4 w-4" aria-hidden="true" />
								{pending && !cameraOn ? labels.lookingUp : labels.lookup}
							</button>
						</div>
					</form>
				</div>
			</section>

			<section
				bind:this={resultPanelEl}
				class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
			>
				{#if resultView.kind === 'pick'}
					<div class="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 px-4 py-3 sm:px-5">
						<p class="text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
							{labels.selectMember}
						</p>
						<p class="mt-0.5 text-xs text-[var(--color-muted)]">
							{labels.matchesHint.replace('{count}', String(resultView.matches.length))}
						</p>
					</div>
					<ul class="flex max-h-[min(40dvh,18rem)] flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2 sm:max-h-[28rem] sm:p-3">
						{#each resultView.matches as m (m.membershipId)}
							<li class="min-w-0">
								<button
									type="button"
									disabled={pending}
									onclick={() => void handleSelectCandidate(m.membershipId)}
									class="flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60 sm:gap-3 sm:px-3 sm:py-3"
								>
									<span
										class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)] sm:h-11 sm:w-11 sm:text-xs"
									>
										{initials(m.name)}
									</span>
									<span class="min-w-0 flex-1 overflow-hidden">
										<span class="flex min-w-0 items-center gap-2">
											<span class="truncate font-semibold text-[var(--color-text)]">{m.name}</span>
											<span
												class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide {m.active
													? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
													: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'}"
											>
												{m.active ? labels.active : labels.expired}
											</span>
										</span>
										<span class="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
											{[m.email, m.phone].filter(Boolean).join(' · ') || '—'}
										</span>
										<span class="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
											{m.planName ?? labels.noPlan}
										</span>
									</span>
									<span
										class="hidden shrink-0 text-xs font-semibold text-[var(--color-primary)] sm:inline"
									>
										{labels.confirmCheckIn}
									</span>
									<ArrowRight
										class="h-4 w-4 shrink-0 text-[var(--color-primary)] sm:hidden"
										aria-hidden="true"
									/>
								</button>
							</li>
						{/each}
					</ul>
				{:else if resultView.kind === 'ok'}
					<div
						class="flex items-center gap-2 bg-[var(--color-primary)] px-5 py-3 text-[var(--color-primary-on)]"
					>
						<Check class="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
						<p class="text-sm font-bold uppercase tracking-wide">{labels.accessGranted}</p>
					</div>
					<div class="flex flex-1 flex-col gap-4 p-5">
						{#if resultView.member}
							<div class="flex items-center gap-3">
								<span
									class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-base font-bold text-[var(--color-primary)]"
								>
									{initials(resultView.member.name)}
								</span>
								<div class="min-w-0">
									<p class="truncate font-title text-xl font-bold text-[var(--color-text)]">
										{resultView.member.name}
									</p>
									<span
										class="mt-1 inline-flex rounded-full border border-[var(--color-primary)]/50 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]"
									>
										{resultView.member.planName || labels.noPlan}
									</span>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-2">
								<div class="rounded-xl bg-[var(--color-bg)] px-3 py-3">
									<p
										class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]"
									>
										{labels.expiresIn}
									</p>
									<p class="mt-1 text-sm font-bold text-[var(--color-text)]">
										{expiresDays}
										{labels.days}
									</p>
								</div>
								<div class="rounded-xl bg-[var(--color-bg)] px-3 py-3">
									<p
										class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]"
									>
										{labels.weekAttendance}
									</p>
									<p class="mt-1 text-sm font-bold text-[var(--color-text)]">
										{resultView.member.weekCheckIns}
									</p>
								</div>
							</div>
							<p class="text-sm text-[var(--color-muted)]">{resultView.message}</p>
							{#if resultView.member.classBooking}
								<p
									class="rounded-xl bg-[var(--color-success)]/10 px-3 py-2 text-sm font-medium text-[var(--color-success)]"
								>
									{labels.classReserved
										.replace('{class}', resultView.member.classBooking.className)
										.replace(
											'{time}',
											new Date(resultView.member.classBooking.startsAt).toLocaleTimeString(
												locale === 'es' ? 'es-MX' : 'en-US',
												{ hour: '2-digit', minute: '2-digit' }
											)
										)}
								</p>
							{/if}
							{#if resultView.member.openSessions && resultView.member.openSessions.length > 0}
								<div class="rounded-xl border border-[var(--color-border)] p-3">
									<p
										class="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
									>
										{labels.walkInTitle}
									</p>
									<ul class="flex flex-col gap-2">
										{#each resultView.member.openSessions as s (s.sessionId)}
											{@const full =
												s.capacity != null && s.confirmedCount >= s.capacity && !s.hasBooking}
											<li class="flex items-center justify-between gap-2 text-sm">
												<span class="min-w-0 truncate text-[var(--color-text)]">
													{s.className}{s.hasBooking ? ` · ${s.bookingStatus}` : ''}
												</span>
												{#if !s.hasBooking}
													{#if full}
														<span class="shrink-0 text-xs text-[var(--color-muted)]"
															>{labels.walkInFull}</span
														>
													{:else}
														<button
															type="button"
															disabled={pending}
															class="min-h-11 shrink-0 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
															onclick={() =>
																void enrollWalkIn(
																	s.sessionId,
																	resultView.kind === 'ok' ? resultView.member!.personId : '',
																	s.className,
																	s.startsAt
																)}
														>
															{labels.walkInEnroll}
														</button>
													{/if}
												{/if}
											</li>
										{/each}
									</ul>
								</div>
							{:else if resultView.member && !resultView.member.classBooking}
								<p class="text-xs text-[var(--color-muted)]">{labels.noOpenClasses}</p>
							{/if}
						{:else}
							<p class="text-sm font-medium text-[var(--color-text)]">{resultView.message}</p>
						{/if}
						<button
							type="button"
							onclick={() => (resultView = { kind: 'idle' })}
							class="mt-auto min-h-11 w-full rounded-lg border border-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
						>
							{labels.nextScan}
						</button>
					</div>
				{:else if resultView.kind === 'error'}
					<div class="flex items-center gap-2 bg-[var(--color-danger)] px-5 py-3 text-white">
						<X class="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
						<p class="text-sm font-bold uppercase tracking-wide">{resultView.title}</p>
					</div>
					<div class="flex flex-1 flex-col gap-4 p-5">
						<p class="text-sm text-[var(--color-text)]">{resultView.message}</p>
						<button
							type="button"
							onclick={() => (resultView = { kind: 'idle' })}
							class="mt-auto min-h-11 w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
						>
							{labels.nextScan}
						</button>
					</div>
				{:else}
					<div class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
						<div
							class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
						>
							<UserRoundCheck class="h-7 w-7" aria-hidden="true" />
						</div>
						<div>
							<p class="font-semibold text-[var(--color-text)]">{labels.waitingResult}</p>
							<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.waitingResultHint}</p>
						</div>
					</div>
				{/if}
			</section>
		</div>
	</div>

	{#if !kioskMode}
		<section
			class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4"
			>
				<h2 class="font-title text-lg font-bold text-[var(--color-text)]">{labels.todayTitle}</h2>
				<a
					href={`/${locale}/checkin/history`}
					class="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
				>
					{labels.viewAllCheckIns}
					<ArrowRight class="h-3.5 w-3.5" aria-hidden="true" />
				</a>
			</div>
			<CheckinList
				{locale}
				items={todayCheckIns}
				detailBaseHref={`/${locale}/checkin/history`}
				labels={{
					colMember: labels.colMember,
					colTime: labels.colTime,
					colPlan: labels.colPlan,
					colSource: labels.colSource,
					noPlan: labels.noPlan,
					sourceQr: labels.sourceQr,
					sourceManual: labels.sourceManual,
					sourceKiosk: labels.sourceKiosk,
					empty: labels.todayEmpty
				}}
			/>
		</section>
	{/if}
</div>
