import type { Component } from 'svelte';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Building2 from '@lucide/svelte/icons/building-2';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import CreditCard from '@lucide/svelte/icons/credit-card';
import Dumbbell from '@lucide/svelte/icons/dumbbell';
import Layers from '@lucide/svelte/icons/layers';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import QrCode from '@lucide/svelte/icons/qr-code';
import Settings from '@lucide/svelte/icons/settings';
import Timer from '@lucide/svelte/icons/timer';
import Users from '@lucide/svelte/icons/users';
import type { OpsNavId } from './ops-nav';

export const OPS_NAV_ICONS: Record<OpsNavId, Component> = {
	dashboard: LayoutDashboard,
	checkin: QrCode,
	members: Users,
	classes: CalendarDays,
	timers: Timer,
	trainers: Dumbbell,
	staff: Briefcase,
	plans: Layers,
	payments: CreditCard,
	organization: Building2,
	settings: Settings
};
