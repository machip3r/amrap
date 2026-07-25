<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import {
		PLAN_COMPARE_FEATURES,
		PLAN_COMPARE_TIERS,
		type PlanCompareFeatureId,
		type PlanCompareValue
	} from '$lib/billing/plan-compare';
	import type { OrgPlanTier } from '$lib/types';

	export type PlanCompareLabels = {
		title: string;
		description: string;
		close: string;
		tierFreemium: string;
		tierStarter: string;
		tierGrowth: string;
		tierPro: string;
		featureGyms: string;
		featureMembers: string;
		featureStaff: string;
		featurePackages: string;
		featureBranding: string;
		featureWatermark: string;
		featureMultiGym: string;
		featureOnlineBilling: string;
		valueYes: string;
		valueNo: string;
		valueLimited: string;
		valueSoon: string;
	};

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		labels: PlanCompareLabels;
	};

	let { open, onOpenChange, labels }: Props = $props();

	function tierLabel(tier: OrgPlanTier) {
		switch (tier) {
			case 'STARTER':
				return labels.tierStarter;
			case 'GROWTH':
				return labels.tierGrowth;
			case 'PRO':
				return labels.tierPro;
			default:
				return labels.tierFreemium;
		}
	}

	function featureLabel(id: PlanCompareFeatureId) {
		switch (id) {
			case 'gyms':
				return labels.featureGyms;
			case 'members':
				return labels.featureMembers;
			case 'staff':
				return labels.featureStaff;
			case 'packages':
				return labels.featurePackages;
			case 'branding':
				return labels.featureBranding;
			case 'watermark':
				return labels.featureWatermark;
			case 'multiGym':
				return labels.featureMultiGym;
			case 'onlineBilling':
				return labels.featureOnlineBilling;
		}
	}

	function valueLabel(value: PlanCompareValue) {
		if (value === 'yes') return labels.valueYes;
		if (value === 'no') return labels.valueNo;
		if (value === 'limited') return labels.valueLimited;
		if (value === 'soon') return labels.valueSoon;
		return value;
	}
</script>

<Dialog
	{open}
	{onOpenChange}
	title={labels.title}
	description={labels.description}
	closeLabel={labels.close}
	class="max-w-4xl"
	bodyClass="overflow-x-auto px-4 py-4 sm:px-6"
>
	<div class="min-w-[36rem]">
		<table class="w-full border-collapse text-left text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					<th class="px-2 py-3 sm:px-3"></th>
					{#each PLAN_COMPARE_TIERS as tier (tier)}
						<th class="px-2 py-3 text-center sm:px-3">{tierLabel(tier)}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each PLAN_COMPARE_FEATURES as feature (feature.id)}
					<tr class="border-b border-[var(--color-border)]/70 last:border-b-0">
						<th
							scope="row"
							class="px-2 py-3 text-left text-sm font-medium text-[var(--color-text)] sm:px-3"
						>
							{featureLabel(feature.id)}
						</th>
						{#each PLAN_COMPARE_TIERS as tier (tier)}
							<td class="px-2 py-3 text-center tabular-nums text-[var(--color-muted)] sm:px-3">
								{valueLabel(feature.values[tier])}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Dialog>
