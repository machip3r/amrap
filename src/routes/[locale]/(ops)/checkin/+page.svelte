<script lang="ts">
	import CheckinDesk from '$lib/components/checkin/CheckinDesk.svelte';

	let { data } = $props();
	const d = $derived(data.d);
	const locale = $derived(data.locale);
</script>

<svelte:head>
	<title>{d.checkin.title} — AMRAP</title>
</svelte:head>

<div class="animate-fade-in-up pb-4">
	<CheckinDesk
		{locale}
		canManageMembers={data.canManageMembers}
		todayCheckIns={data.todayCheckIns}
		registerLabel={d.registerUser.open}
		labels={{
			title: d.checkin.title,
			subtitle: d.checkin.subtitle,
			scanTitle: d.checkin.scanTitle,
			scanHint: d.checkin.scanHint,
			manualTitle: d.checkin.manualTitle,
			manualLabel: d.checkin.manualLabel,
			manualPlaceholder: d.checkin.manualPlaceholder,
			lookup: d.checkin.lookup,
			clear: d.checkin.clear,
			scanning: d.checkin.scanning,
			lookingUp: d.checkin.lookingUp,
			stopCamera: d.checkin.stopCamera,
			startCamera: d.checkin.startCamera,
			resultOk: d.checkin.resultOk,
			resultDenied: d.checkin.resultDenied,
			memberNotFound: d.checkin.memberNotFound,
			selectMember: d.checkin.selectMember,
			confirmCheckIn: d.checkin.confirmCheckIn,
			matchesHint: d.checkin.matchesHint,
			active: d.checkin.active,
			expired: d.checkin.expired,
			qrInUse: d.checkin.qrInUse,
			cameraError: d.checkin.cameraError,
			forbidden: d.common.forbidden,
			saveFailed: d.common.saveFailed,
			accessGranted: d.checkin.accessGranted,
			accessDenied: d.checkin.accessDenied,
			qrSuccessTitle: d.checkin.qrSuccessTitle,
			qrSuccessHint: d.checkin.qrSuccessHint,
			waitingResult: d.checkin.waitingResult,
			waitingResultHint: d.checkin.waitingResultHint,
			expiresIn: d.checkin.expiresIn,
			days: d.checkin.days,
			weekAttendance: d.checkin.weekAttendance,
			noPlan: d.checkin.noPlan,
			nextScan: d.checkin.nextScan,
			classReserved: d.checkin.classReserved,
			walkInTitle: d.checkin.walkInTitle,
			walkInEnroll: d.checkin.walkInEnroll,
			walkInFull: d.checkin.walkInFull,
			noOpenClasses: d.checkin.noOpenClasses,
			todayTitle: d.checkin.todayTitle,
			todayEmpty: d.checkin.todayEmpty,
			viewAllCheckIns: d.checkin.viewAllCheckIns,
			colMember: d.checkin.colMember,
			colTime: d.checkin.colTime,
			colPlan: d.checkin.colPlan,
			colSource: d.checkin.colSource,
			sourceQr: d.checkin.sourceQr,
			sourceManual: d.checkin.sourceManual,
			sourceKiosk: d.checkin.sourceKiosk
		}}
	/>
</div>
