<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import CheckinList from '$lib/components/checkin/CheckinList.svelte';
	import CheckinHistoryFilters from '$lib/components/checkin/CheckinHistoryFilters.svelte';
	import TablePagination from '$lib/components/ui/TablePagination.svelte';
	import { brandedTitle } from '$lib/seo/document-title';

	let { data } = $props();
	const d = $derived(data.d);
	const locale = $derived(data.locale);

	const paginationParams = $derived.by(() => {
		const params: Record<string, string> = { date: data.date };
		if (data.personType) params.type = data.personType;
		return params;
	});
</script>

<svelte:head>
	<title>{brandedTitle(d.checkin.historyTitle, data.documentBrand)}</title>
</svelte:head>

<div class="animate-fade-in-up flex w-full flex-col gap-5 pb-4">
	<header class="flex flex-col gap-3">
		<a
			href={`/${locale}/checkin`}
			class="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
		>
			<ArrowLeft class="h-4 w-4" aria-hidden="true" />
			{d.checkin.backToCheckIn}
		</a>
		<div>
			<h1 class="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
				{d.checkin.historyTitle}
			</h1>
			<p class="mt-1 text-sm text-[var(--color-muted)]">{d.checkin.historySubtitle}</p>
		</div>
	</header>

	<CheckinHistoryFilters
		date={data.date}
		today={data.today}
		personType={data.personType}
		labels={{
			filterDate: d.checkin.filterDate,
			filterPersonType: d.checkin.filterPersonType,
			filterAllTypes: d.checkin.filterAllTypes,
			filterMembers: d.checkin.filterMembers,
			filterTrainers: d.checkin.filterTrainers,
			filterStaff: d.checkin.filterStaff,
			filterApply: d.checkin.filterApply,
			filterClear: d.checkin.filterClear
		}}
	/>

	<div
		class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
	>
		<CheckinList
			{locale}
			items={data.items}
			detailBaseHref={`/${locale}/checkin/history`}
			showMemberProfileLink={data.canManageMembers}
			labels={{
				colMember: d.checkin.colMember,
				colTime: d.checkin.colTime,
				colPlan: d.checkin.colPlan,
				colSource: d.checkin.colSource,
				noPlan: d.checkin.noPlan,
				sourceQr: d.checkin.sourceQr,
				sourceManual: d.checkin.sourceManual,
				sourceKiosk: d.checkin.sourceKiosk,
				empty: d.checkin.historyEmpty,
				viewMemberProfile: d.checkin.viewMemberProfile
			}}
		/>
		<TablePagination
			meta={data.meta}
			href={`/${locale}/checkin/history`}
			searchParams={paginationParams}
			labels={{
				showing: d.members.showing,
				previous: d.common.previous,
				next: d.common.next
			}}
		/>
	</div>
</div>
