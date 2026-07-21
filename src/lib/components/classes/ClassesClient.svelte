<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Archive from '@lucide/svelte/icons/archive';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Layers from '@lucide/svelte/icons/layers';
	import Loader2 from '@lucide/svelte/icons/loader-circle';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Users from '@lucide/svelte/icons/users';
	import WeekdayToggleGroup from '$lib/components/classes/WeekdayToggleGroup.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { addDays, startOfWeekMonday, type ClassSessionRow } from '$lib/classes/types';
	import type { Locale } from '$lib/i18n/config';
	import type { Dictionary } from '$lib/i18n/dictionaries';
	import type { ClassFormState, ScheduleFormState } from '$lib/server/classes/actions';
	import { LIMITS } from '$lib/validation/schemas';

	export type ClassesPageClass = {
		id: string;
		name: string;
		description: string | null;
		capacity: number | null;
		duration_minutes: number;
		tags: string[];
		is_active: boolean;
		trainerIds: string[];
		trainerNames: string[];
	};

	export type ClassesTrainerOption = {
		userId: string;
		name: string;
	};

	export type OrgGymOption = {
		id: string;
		name: string;
	};

	type ClassesView = 'catalog' | 'calendar';

	type Props = {
		locale: Locale;
		d: Dictionary;
		classes: ClassesPageClass[];
		trainers: ClassesTrainerOption[];
		sessions: ClassSessionRow[];
		weekStartIso: string;
		orgGyms: OrgGymOption[];
		currentGymId: string;
		canManage: boolean;
		defaultTrainerIds?: string[];
		lockTrainersToSelf?: boolean;
		currentUserId?: string;
		initialView: ClassesView;
	};

	let {
		locale,
		d,
		classes,
		trainers,
		sessions,
		weekStartIso,
		orgGyms,
		currentGymId,
		canManage,
		defaultTrainerIds = undefined,
		lockTrainersToSelf = false,
		currentUserId = undefined,
		initialView
	}: Props = $props();

	const labels = $derived(d.classes);

	let view = $state<ClassesView>(initialView);
	let pendingNav = $state(false);

	$effect(() => {
		view = initialView;
	});

	let createOpen = $state(false);
	let createKey = $state(0);
	let editing = $state<ClassesPageClass | null>(null);
	let archiving = $state<ClassesPageClass | null>(null);
	let scheduling = $state<ClassesPageClass | null>(null);
	let duplicating = $state<ClassesPageClass | null>(null);
	let scheduleRecurrence = $state<'none' | 'weekly'>('weekly');

	let createPending = $state(false);
	let createState = $state<ClassFormState>(null);
	let editPending = $state(false);
	let editState = $state<ClassFormState>(null);
	let schedulePending = $state(false);
	let scheduleState = $state<ScheduleFormState>(null);
	let restorePending = $state<string | null>(null);
	let withSchedule = $state(false);
	let createScheduleRecurrence = $state<'none' | 'weekly'>('weekly');

	const weekStart = $derived(new Date(weekStartIso));
	const weekParam = $derived(
		`${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
	);
	const days = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));

	const sessionsByDay = $derived.by(() => {
		const map = new Map<string, ClassSessionRow[]>();
		for (const s of sessions) {
			const key = new Date(s.starts_at).toDateString();
			const list = map.get(key) ?? [];
			list.push(s);
			map.set(key, list);
		}
		return map;
	});

	const visibleDays = $derived.by(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const localTodayKey = today.toDateString();
		const inWeek = days.some((day) => day.toDateString() === localTodayKey);

		if (sessions.length === 0) return days;

		const filtered = days.filter((day) => {
			const key = day.toDateString();
			const hasSessions = (sessionsByDay.get(key)?.length ?? 0) > 0;
			const isToday = inWeek && key === localTodayKey;
			return hasSessions || isToday;
		});

		return filtered.length > 0 ? filtered : days;
	});

	const todayKey = $derived.by(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return today.toDateString();
	});

	const active = $derived(classes.filter((c) => c.is_active));
	const archived = $derived(classes.filter((c) => !c.is_active));
	const otherGyms = $derived(orgGyms.filter((g) => g.id !== currentGymId));
	const todayStr = $derived.by(() => {
		const today = new Date();
		return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	});

	const selfTrainer = $derived(
		currentUserId ? trainers.find((t) => t.userId === currentUserId) : null
	);

	const calendarGridClass = $derived(
		visibleDays.length <= 1
			? 'grid-cols-1'
			: visibleDays.length === 2
				? 'grid-cols-1 md:grid-cols-2'
				: visibleDays.length === 3
					? 'grid-cols-1 md:grid-cols-3'
					: visibleDays.length === 4
						? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
						: visibleDays.length <= 5
							? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
							: visibleDays.length === 6
								? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
								: 'grid-cols-1 md:grid-cols-4 lg:grid-cols-7'
	);

	function trainerCountLabel(template: string, count: number) {
		return template.replace('{count}', String(count));
	}

	function weekRangeLabel() {
		const start = days[0];
		const end = days[6];
		if (!start || !end) return labels.thisWeek;
		const sameMonth = start.getMonth() === end.getMonth();
		const loc = locale === 'es' ? 'es-MX' : 'en-US';
		const startLabel = start.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
		const endLabel = end.toLocaleDateString(
			loc,
			sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' }
		);
		return `${startLabel} – ${endLabel}`;
	}

	async function selectView(next: ClassesView) {
		const q = new URLSearchParams();
		q.set('tab', next);
		if (next === 'calendar') q.set('week', weekParam);
		pendingNav = true;
		view = next;
		await goto(`/${locale}/classes?${q.toString()}`, { replaceState: true, noScroll: true });
		pendingNav = false;
	}

	async function goWeek(delta: number) {
		const next = startOfWeekMonday(addDays(weekStart, delta * 7));
		const y = next.getFullYear();
		const m = String(next.getMonth() + 1).padStart(2, '0');
		const day = String(next.getDate()).padStart(2, '0');
		const q = new URLSearchParams({ tab: 'calendar', week: `${y}-${m}-${day}` });
		pendingNav = true;
		view = 'calendar';
		await goto(`/${locale}/classes?${q.toString()}`, { noScroll: true });
		pendingNav = false;
	}

	function resetCreate() {
		createState = null;
		withSchedule = false;
		createScheduleRecurrence = 'weekly';
		createKey += 1;
	}
</script>

<header class="flex items-start justify-between gap-3">
	<div class="min-w-0">
		<h1 class="font-title text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
			{d.classes.title}
		</h1>
		<p class="mt-1 text-sm text-[var(--color-muted)]">{labels.subtitle}</p>
	</div>
	{#if canManage}
		<Button
			type="button"
			variant="toolbar"
			onclick={() => {
				resetCreate();
				createOpen = true;
			}}
		>
			<Plus class="h-4 w-4 shrink-0" aria-hidden="true" />
			<span class="shrink-0">{labels.newClass}</span>
		</Button>
	{/if}
</header>

<div
	role="tablist"
	aria-label={d.classes.title}
	class="flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5"
>
	{#each [
		{ id: 'catalog' as const, label: labels.tabCatalog, Icon: Layers },
		{ id: 'calendar' as const, label: labels.tabCalendar, Icon: CalendarDays }
	] as item (item.id)}
		{@const selected = view === item.id}
		<button
			type="button"
			role="tab"
			aria-selected={selected}
			id={`classes-view-${item.id}`}
			tabindex={selected ? 0 : -1}
			disabled={pendingNav}
			onclick={() => selectView(item.id)}
			onkeydown={(e) => {
				if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
					e.preventDefault();
					selectView(item.id === 'catalog' ? 'calendar' : 'catalog');
				}
			}}
			class="inline-flex h-11 min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:opacity-60 {selected
				? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
				: 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}"
		>
			<item.Icon class="h-4 w-4 shrink-0" aria-hidden="true" />
			<span>{item.label}</span>
		</button>
	{/each}
</div>

<div role="tabpanel" aria-labelledby={`classes-view-${view}`} class="min-w-0">
	{#if pendingNav}
		<p class="py-10 text-center text-sm text-[var(--color-muted)]">{labels.loading}</p>
	{:else if view === 'catalog'}
		{#if classes.length === 0}
			<section
				class="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-14 text-center"
			>
				<div
					class="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
				>
					<CalendarDays class="h-5 w-5" aria-hidden="true" />
				</div>
				<p class="text-sm text-[var(--color-muted)]">{labels.noClasses}</p>
			</section>
		{:else}
			<div class="flex flex-col gap-4">
				{#each active as c (c.id)}
					<article
						class="rounded-2xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
					>
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
							{#if canManage}
								<div class="order-2 flex shrink-0 flex-wrap items-center gap-1 sm:order-1">
									<button
										type="button"
										onclick={() => {
											scheduleRecurrence = 'weekly';
											scheduling = c;
										}}
										class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
										title={labels.schedule}
									>
										<CalendarDays class="h-4 w-4" aria-hidden="true" />
										{labels.schedule}
									</button>
									{#if otherGyms.length > 0}
										<button
											type="button"
											onclick={() => (duplicating = c)}
											class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
											aria-label={labels.duplicate}
											title={labels.duplicate}
										>
											<Copy class="h-4 w-4" aria-hidden="true" />
										</button>
									{/if}
									<button
										type="button"
										onclick={() => (editing = c)}
										class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
										aria-label={labels.edit}
									>
										<Pencil class="h-4 w-4" aria-hidden="true" />
									</button>
									<button
										type="button"
										onclick={() => (archiving = c)}
										class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)]"
										aria-label={labels.archive}
									>
										<Archive class="h-4 w-4" aria-hidden="true" />
									</button>
								</div>
							{/if}
							<div class="order-1 min-w-0 flex-1 sm:order-2">
								<div class="flex flex-wrap items-center gap-2">
									<h2 class="font-title text-xl font-bold text-[var(--color-text)]">{c.name}</h2>
									<span
										class="rounded-md bg-[var(--color-success)]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-success)]"
									>
										{labels.active}
									</span>
								</div>
								{#if c.description}
									<p class="mt-1 text-sm text-[var(--color-muted)]">{c.description}</p>
								{/if}
								{#if c.tags.length > 0}
									<div class="mt-2 flex flex-wrap gap-1.5">
										{#each c.tags as t (t)}
											<span
												class="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
											>
												{t}
											</span>
										{/each}
									</div>
								{/if}
								<div class="mt-3 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
									<span class="inline-flex items-center gap-1.5">
										<Users class="h-3.5 w-3.5" aria-hidden="true" />
										{c.capacity != null ? String(c.capacity) : labels.unlimited}
									</span>
									<span>{c.duration_minutes} min</span>
									<span>
										{trainerCountLabel(labels.trainerCount, c.trainerIds.length)}
										{c.trainerNames.length > 0 ? `: ${c.trainerNames.join(', ')}` : ''}
									</span>
								</div>
							</div>
						</div>
					</article>
				{/each}

				{#if archived.length > 0}
					<div class="mt-2 flex flex-col gap-3">
						<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
							{labels.archived}
						</h3>
						{#each archived as c (c.id)}
							<article
								class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 sm:p-6"
							>
								<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
									<form
										method="POST"
										action="?/setActive"
										class="order-2 sm:order-1"
										use:enhance={() => {
											restorePending = c.id;
											return async ({ update }) => {
												restorePending = null;
												await update();
											};
										}}
									>
										<input type="hidden" name="locale" value={locale} />
										<input type="hidden" name="class_id" value={c.id} />
										<input type="hidden" name="is_active" value="true" />
										<button
											type="submit"
											disabled={restorePending === c.id}
											class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium disabled:opacity-60"
										>
											{#if restorePending === c.id}
												<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
												{labels.restoring}
											{:else}
												<ArchiveRestore class="h-4 w-4" aria-hidden="true" />
												{labels.restore}
											{/if}
										</button>
									</form>
									<h2 class="order-1 font-title text-lg font-bold text-[var(--color-text)] sm:order-2">
										{c.name}
									</h2>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					onclick={() => goWeek(-1)}
					disabled={pendingNav}
					class="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 text-sm disabled:opacity-50"
				>
					<ChevronLeft class="h-4 w-4" />
					{labels.prevWeek}
				</button>
				<p class="text-sm font-semibold text-[var(--color-text)]">{weekRangeLabel()}</p>
				<button
					type="button"
					onclick={() => goWeek(1)}
					disabled={pendingNav}
					class="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 text-sm disabled:opacity-50"
				>
					{labels.nextWeek}
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>

			<div class="grid gap-3 {calendarGridClass}">
				{#each visibleDays as day (day.toISOString())}
					{@const dayKey = day.toDateString()}
					{@const list = sessionsByDay.get(dayKey) ?? []}
					{@const isToday = dayKey === todayKey}
					{@const dayLabel = day.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
						weekday: 'short'
					})}
					{@const dayFull = day.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
						weekday: 'long',
						month: 'short',
						day: 'numeric'
					})}
					<section
						class="flex min-h-0 min-w-0 flex-col rounded-xl border bg-[var(--color-surface)] p-3 sm:p-3 {isToday
							? 'border-[var(--color-primary)]/50 ring-1 ring-[var(--color-primary)]/20'
							: 'border-[var(--color-border)]'}"
					>
						<header class="mb-3 flex items-center justify-between gap-2 px-0.5">
							<div class="min-w-0">
								<span class="hidden text-sm font-bold text-[var(--color-text)] md:inline"
									>{dayLabel}</span
								>
								<span class="truncate text-sm font-bold text-[var(--color-text)] md:hidden"
									>{dayFull}</span
								>
							</div>
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums md:h-7 md:w-7 md:text-xs {isToday
									? 'bg-[var(--color-primary)] text-[var(--color-primary-on)]'
									: 'bg-[var(--color-bg)] text-[var(--color-text)]'}"
							>
								{day.getDate()}
							</span>
						</header>
						{#if list.length === 0}
							<p class="mt-1 flex-1 py-2 text-center text-sm text-[var(--color-muted)] md:text-xs">
								—
							</p>
						{:else}
							<ul class="flex flex-1 flex-col gap-2 md:gap-1.5">
								{#each list as s (s.id)}
									{@const seats =
										s.capacity == null
											? labels.unlimited
											: `${s.confirmed_count ?? 0}/${s.capacity}`}
									{@const timeOnly = new Date(s.starts_at).toLocaleTimeString(
										locale === 'es' ? 'es-MX' : 'en-US',
										{ hour: '2-digit', minute: '2-digit' }
									)}
									<li>
										<a
											href={`/${locale}/classes/${s.id}`}
											class="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)] md:block md:min-h-0 md:px-2 md:py-1.5 {s.status ===
											'cancelled'
												? 'border-[var(--color-border)] opacity-55'
												: 'border-[var(--color-border)]'}"
											title={`${s.class_name} · ${seats}`}
										>
											<div class="min-w-0 flex-1">
												<p
													class="truncate text-sm font-semibold text-[var(--color-text)] md:text-xs"
												>
													{s.class_name}
												</p>
												<p class="truncate text-xs text-[var(--color-muted)] md:text-[10px]">
													{timeOnly}<span class="md:hidden">
														{' · '}{seats}{(s.waitlist_count ?? 0) > 0
															? ` · +${s.waitlist_count}`
															: ''}</span
													>
												</p>
												<p
													class="mt-0.5 hidden truncate text-[10px] text-[var(--color-muted)] md:block"
												>
													{seats}{(s.waitlist_count ?? 0) > 0 ? ` · +${s.waitlist_count}` : ''}
												</p>
											</div>
											<ChevronRight
												class="h-4 w-4 shrink-0 text-[var(--color-muted)] md:hidden"
												aria-hidden="true"
											/>
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</section>
				{/each}
			</div>

			{#if sessions.length === 0}
				<p class="text-center text-sm text-[var(--color-muted)]">{labels.noSessions}</p>
			{/if}
		</div>
	{/if}
</div>

<Dialog
	open={createOpen}
	onOpenChange={(open) => (createOpen = open)}
	title={labels.createTitle}
	description={labels.createDescription}
	closeLabel={labels.close}
	class="max-w-lg"
>
	{#if createOpen}
		<form
			method="POST"
			action="?/create"
			novalidate
			class="flex flex-col gap-4"
			use:enhance={() => {
				createPending = true;
				return async ({ result, update }) => {
					createPending = false;
					if (result.type === 'success' && result.data && typeof result.data === 'object') {
						const data = result.data as ClassFormState;
						createState = data;
						if (data?.success) {
							createOpen = false;
							resetCreate();
						}
					}
					await update();
				};
			}}
		>
			{#key createKey}
				<input type="hidden" name="locale" value={locale} />
				<FormField label={labels.className} htmlFor="create-class-name" error={createState?.fieldErrors?.name}>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-class-name"
							name="name"
							required
							maxlength={LIMITS.entityName}
							autocomplete="off"
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>
				<FormField
					label={labels.description}
					htmlFor="create-class-desc"
					hint={labels.descriptionHint}
					error={createState?.fieldErrors?.description}
				>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-class-desc"
							name="description"
							maxlength={LIMITS.message}
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>
				<FormField
					label={labels.capacity}
					htmlFor="create-class-capacity"
					hint={labels.capacityHint}
					error={createState?.fieldErrors?.capacity}
				>
					{#snippet children({ invalid, describedBy })}
						<Input
							id="create-class-capacity"
							name="capacity"
							type="number"
							min={1}
							max={10_000}
							step={1}
							inputmode="numeric"
							placeholder={labels.unlimited}
							{invalid}
							{describedBy}
						/>
					{/snippet}
				</FormField>

				<div>
					<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">{labels.trainers}</p>
					<p class="mb-2 text-xs text-[var(--color-muted)]">
						{lockTrainersToSelf ? labels.trainersSelfHint : labels.trainersHint}
					</p>
					{#if lockTrainersToSelf && currentUserId}
						<input type="hidden" name="trainer_ids" value={currentUserId} />
						<p
							class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)]"
						>
							{selfTrainer?.name ?? labels.youAreTrainer}
						</p>
					{:else if trainers.length === 0}
						<p class="text-sm text-[var(--color-muted)]">{labels.noTrainers}</p>
					{:else}
						<ul
							class="max-h-40 space-y-1 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2"
						>
							{#each trainers as t (t.userId)}
								<li>
									<label
										class="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
									>
										<input
											type="checkbox"
											name="trainer_ids"
											value={t.userId}
											checked={defaultTrainerIds?.includes(t.userId) ?? false}
											class="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
										/>
										<span class="truncate">{t.name}</span>
									</label>
								</li>
							{/each}
						</ul>
					{/if}
					{#if createState?.fieldErrors?.trainer_ids}
						<p class="mt-1.5 text-sm font-medium text-[var(--color-primary)]" role="alert">
							{createState.fieldErrors.trainer_ids}
						</p>
					{/if}
				</div>

				<details
					class="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] open:bg-[var(--color-surface)]"
				>
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text)] marker:content-none [&::-webkit-details-marker]:hidden"
					>
						<span class="min-w-0">
							<span class="block">{labels.advancedSettings}</span>
							<span class="mt-0.5 block text-xs font-normal text-[var(--color-muted)]"
								>{labels.advancedHint}</span
							>
						</span>
						<ChevronRight
							class="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-90"
							aria-hidden="true"
						/>
					</summary>
					<div class="flex flex-col gap-4 border-t border-[var(--color-border)] px-3 py-3">
						<div class="grid gap-4 sm:grid-cols-2">
							<FormField
								label={labels.duration}
								htmlFor="create-duration"
								hint={labels.durationHint}
								error={createState?.fieldErrors?.duration_minutes}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="create-duration"
										name="duration_minutes"
										type="number"
										min={1}
										max={1440}
										step={1}
										inputmode="numeric"
										value="60"
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
							<FormField
								label={labels.tags}
								htmlFor="create-tags"
								hint={labels.tagsHint}
								error={createState?.fieldErrors?.tags}
							>
								{#snippet children({ invalid, describedBy })}
									<Input
										id="create-tags"
										name="tags"
										placeholder="yoga, hiit"
										{invalid}
										{describedBy}
									/>
								{/snippet}
							</FormField>
						</div>

						<div class="flex flex-col gap-3 rounded-lg border border-[var(--color-border)]/80 p-3">
							<label class="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-text)]">
								<input
									type="checkbox"
									name="with_schedule"
									checked={withSchedule}
									onchange={(e) => (withSchedule = e.currentTarget.checked)}
									class="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
								/>
								<span>
									<span class="font-medium">{labels.addScheduleNow}</span>
									<span class="mt-0.5 block text-xs text-[var(--color-muted)]"
										>{labels.scheduleHint}</span
									>
								</span>
							</label>

							{#if withSchedule}
								<div class="flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
									<input type="hidden" name="timezone" value="America/Mexico_City" />
									<FormField label={labels.recurrence} htmlFor="create-recurrence">
										{#snippet children()}
											<select
												id="create-recurrence"
												name="recurrence"
												class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
												bind:value={createScheduleRecurrence}
											>
												<option value="weekly">{labels.recurrenceWeekly}</option>
												<option value="none">{labels.recurrenceNone}</option>
											</select>
										{/snippet}
									</FormField>
									{#if createScheduleRecurrence === 'weekly'}
										<WeekdayToggleGroup
											legend={labels.days}
											labels={[
												labels.dayMon,
												labels.dayTue,
												labels.dayWed,
												labels.dayThu,
												labels.dayFri,
												labels.daySat,
												labels.daySun
											]}
											error={createState?.fieldErrors?.days_of_week}
										/>
									{/if}
									<div class="grid gap-3 sm:grid-cols-2">
										<FormField
											label={labels.time}
											htmlFor="create-local-time"
											error={createState?.fieldErrors?.local_time}
										>
											{#snippet children({ invalid, describedBy })}
												<Input
													id="create-local-time"
													name="local_time"
													type="time"
													required={withSchedule}
													value="07:00"
													{invalid}
													{describedBy}
												/>
											{/snippet}
										</FormField>
										<FormField
											label={labels.validFrom}
											htmlFor="create-valid-from"
											error={createState?.fieldErrors?.valid_from}
										>
											{#snippet children({ invalid, describedBy })}
												<Input
													id="create-valid-from"
													name="valid_from"
													type="date"
													required={withSchedule}
													value={todayStr}
													{invalid}
													{describedBy}
												/>
											{/snippet}
										</FormField>
									</div>
									<FormField label={labels.validUntil} htmlFor="create-valid-until">
										{#snippet children({ invalid, describedBy })}
											<Input
												id="create-valid-until"
												name="valid_until"
												type="date"
												{invalid}
												{describedBy}
											/>
										{/snippet}
									</FormField>
								</div>
							{/if}
						</div>
					</div>
				</details>

				{#if createState?.error}
					<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{createState.error}</p>
				{/if}
				<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="ghost"
						class="rounded-lg px-4 py-2.5 text-sm font-semibold"
						onclick={() => (createOpen = false)}
						disabled={createPending}
					>
						{labels.cancel}
					</Button>
					<Button type="submit" class="inline-flex items-center justify-center gap-2 shadow-sm" disabled={createPending}>
						{#if createPending}
							<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
						{/if}
						{createPending ? labels.saving : labels.save}
					</Button>
				</div>
			{/key}
		</form>
	{/if}
</Dialog>

<Dialog
	open={Boolean(editing)}
	onOpenChange={(open) => {
		if (!open) editing = null;
	}}
	title={labels.editTitle}
	description={labels.editDescription}
	closeLabel={labels.close}
	class="max-w-lg"
>
	{#if editing}
		{@const editClass = editing}
		<form
			method="POST"
			action="?/update"
			novalidate
			class="flex flex-col gap-4"
			use:enhance={() => {
				editPending = true;
				return async ({ result, update }) => {
					editPending = false;
					if (result.type === 'success' && result.data && typeof result.data === 'object') {
						const data = result.data as ClassFormState;
						editState = data;
						if (data?.success) editing = null;
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="class_id" value={editClass.id} />
			<FormField label={labels.className} htmlFor="edit-class-name" error={editState?.fieldErrors?.name}>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="edit-class-name"
						name="name"
						required
						maxlength={LIMITS.entityName}
						value={editClass.name}
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>
			<FormField
				label={labels.description}
				htmlFor="edit-class-desc"
				hint={labels.descriptionHint}
				error={editState?.fieldErrors?.description}
			>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="edit-class-desc"
						name="description"
						maxlength={LIMITS.message}
						value={editClass.description ?? ''}
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>
			<FormField
				label={labels.capacity}
				htmlFor="edit-class-capacity"
				hint={labels.capacityHint}
				error={editState?.fieldErrors?.capacity}
			>
				{#snippet children({ invalid, describedBy })}
					<Input
						id="edit-class-capacity"
						name="capacity"
						type="number"
						min={1}
						max={10_000}
						step={1}
						inputmode="numeric"
						placeholder={labels.unlimited}
						value={editClass.capacity != null ? String(editClass.capacity) : ''}
						{invalid}
						{describedBy}
					/>
				{/snippet}
			</FormField>

			<div>
				<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">{labels.trainers}</p>
				{#if lockTrainersToSelf && currentUserId}
					<input type="hidden" name="trainer_ids" value={currentUserId} />
					<p
						class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2.5 text-sm font-medium"
					>
						{selfTrainer?.name ?? labels.youAreTrainer}
					</p>
				{:else if trainers.length === 0}
					<p class="text-sm text-[var(--color-muted)]">{labels.noTrainers}</p>
				{:else}
					<ul
						class="max-h-40 space-y-1 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2"
					>
						{#each trainers as t (t.userId)}
							<li>
								<label
									class="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--color-surface)]"
								>
									<input
										type="checkbox"
										name="trainer_ids"
										value={t.userId}
										checked={editClass.trainerIds.includes(t.userId)}
										class="h-4 w-4 rounded border-[var(--color-border)]"
									/>
									<span class="truncate">{t.name}</span>
								</label>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<details class="group rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden"
				>
					<span>
						<span class="block">{labels.advancedSettings}</span>
						<span class="mt-0.5 block text-xs font-normal text-[var(--color-muted)]"
							>{labels.advancedHint}</span
						>
					</span>
					<ChevronRight class="h-4 w-4 shrink-0 text-[var(--color-muted)] group-open:rotate-90" />
				</summary>
				<div class="grid gap-4 border-t border-[var(--color-border)] px-3 py-3 sm:grid-cols-2">
					<FormField label={labels.duration} htmlFor="edit-duration" hint={labels.durationHint}>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="edit-duration"
								name="duration_minutes"
								type="number"
								min={1}
								max={1440}
								value={String(editClass.duration_minutes)}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
					<FormField label={labels.tags} htmlFor="edit-tags" hint={labels.tagsHint}>
						{#snippet children({ invalid, describedBy })}
							<Input
								id="edit-tags"
								name="tags"
								value={editClass.tags.join(', ')}
								{invalid}
								{describedBy}
							/>
						{/snippet}
					</FormField>
				</div>
			</details>

			{#if editState?.error}
				<p class="text-sm font-medium text-[var(--color-primary)]" role="alert">{editState.error}</p>
			{/if}
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="ghost" onclick={() => (editing = null)} disabled={editPending}
					>{labels.cancel}</Button
				>
				<Button type="submit" disabled={editPending} class="inline-flex items-center gap-2">
					{#if editPending}<Loader2 class="h-4 w-4 animate-spin" />{/if}
					{editPending ? labels.saving : labels.save}
				</Button>
			</div>
		</form>
	{/if}
</Dialog>

<Dialog
	open={Boolean(scheduling)}
	onOpenChange={(open) => {
		if (!open) scheduling = null;
	}}
	title={labels.scheduleTitle}
	description={labels.scheduleHint}
	closeLabel={labels.close}
	class="max-w-lg"
>
	{#if scheduling}
		<form
			method="POST"
			action="?/schedule"
			novalidate
			class="flex flex-col gap-4"
			use:enhance={() => {
				schedulePending = true;
				return async ({ result, update }) => {
					schedulePending = false;
					if (result.type === 'success' && result.data && typeof result.data === 'object') {
						const data = result.data as ScheduleFormState;
						scheduleState = data;
						if (data?.success) {
							scheduling = null;
							await selectView('calendar');
						}
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="class_id" value={scheduling.id} />
			<input type="hidden" name="timezone" value="America/Mexico_City" />
			<FormField label={labels.recurrence} htmlFor="sched-recurrence">
				{#snippet children()}
					<select
						id="sched-recurrence"
						name="recurrence"
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
						bind:value={scheduleRecurrence}
					>
						<option value="weekly">{labels.recurrenceWeekly}</option>
						<option value="none">{labels.recurrenceNone}</option>
					</select>
				{/snippet}
			</FormField>
			{#if scheduleRecurrence === 'weekly'}
				<WeekdayToggleGroup
					legend={labels.days}
					labels={[
						labels.dayMon,
						labels.dayTue,
						labels.dayWed,
						labels.dayThu,
						labels.dayFri,
						labels.daySat,
						labels.daySun
					]}
					error={scheduleState?.fieldErrors?.days_of_week}
				/>
			{/if}
			<div class="grid gap-4 sm:grid-cols-2">
				<FormField label={labels.time} htmlFor="sched-time">
					{#snippet children({ invalid, describedBy })}
						<Input id="sched-time" name="local_time" type="time" required value="07:00" {invalid} {describedBy} />
					{/snippet}
				</FormField>
				<FormField label={labels.validFrom} htmlFor="sched-from">
					{#snippet children({ invalid, describedBy })}
						<Input id="sched-from" name="valid_from" type="date" required value={todayStr} {invalid} {describedBy} />
					{/snippet}
				</FormField>
			</div>
			<FormField label={labels.validUntil} htmlFor="sched-until">
				{#snippet children({ invalid, describedBy })}
					<Input id="sched-until" name="valid_until" type="date" {invalid} {describedBy} />
				{/snippet}
			</FormField>
			{#if scheduleState?.error}
				<p class="text-sm text-[var(--color-primary)]" role="alert">{scheduleState.error}</p>
			{/if}
			<div class="flex justify-end gap-2">
				<Button type="button" variant="ghost" onclick={() => (scheduling = null)}>{labels.cancel}</Button>
				<Button type="submit" disabled={schedulePending} class="inline-flex items-center gap-2">
					{#if schedulePending}<Loader2 class="h-4 w-4 animate-spin" />{/if}
					{schedulePending ? labels.saving : labels.save}
				</Button>
			</div>
		</form>
	{/if}
</Dialog>

<Dialog
	open={Boolean(duplicating)}
	onOpenChange={(open) => {
		if (!open) duplicating = null;
	}}
	title={labels.duplicateTitle}
	description={labels.duplicateHint}
	closeLabel={labels.close}
	class="max-w-md"
>
	{#if duplicating}
		<form
			method="POST"
			action="?/duplicate"
			class="flex flex-col gap-4"
			use:enhance={() => {
				return async ({ update }) => {
					duplicating = null;
					await update();
				};
			}}
		>
			<input type="hidden" name="locale" value={locale} />
			<input type="hidden" name="class_id" value={duplicating.id} />
			<FormField label={labels.targetGym} htmlFor="dup-gym">
				{#snippet children()}
					<select
						id="dup-gym"
						name="target_gym_id"
						required
						class="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
						value={otherGyms[0]?.id}
					>
						{#each otherGyms as g (g.id)}
							<option value={g.id}>{g.name}</option>
						{/each}
					</select>
				{/snippet}
			</FormField>
			<div class="flex justify-end gap-2">
				<Button type="button" variant="ghost" onclick={() => (duplicating = null)}>{labels.cancel}</Button>
				<Button type="submit">{labels.duplicate}</Button>
			</div>
		</form>
	{/if}
</Dialog>

<ConfirmDialog
	open={archiving != null}
	onclose={() => (archiving = null)}
	title={labels.archive}
	description={archiving ? labels.archiveConfirm.replace('{name}', archiving.name) : undefined}
	cancelLabel={labels.cancel}
	confirmLabel={labels.archive}
	action="?/setActive"
>
	{#if archiving}
		<input type="hidden" name="locale" value={locale} />
		<input type="hidden" name="class_id" value={archiving.id} />
		<input type="hidden" name="is_active" value="false" />
	{/if}
</ConfirmDialog>
