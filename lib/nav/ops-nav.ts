import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  QrCode,
  Users,
  CreditCard,
  Layers,
  Dumbbell,
  Briefcase,
  Building2,
  CalendarDays,
  Settings,
} from "lucide-react";
import type { Role } from "@/types";
import { can } from "@/lib/auth/permissions";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type OpsNavId =
  | "dashboard"
  | "checkin"
  | "members"
  | "classes"
  | "trainers"
  | "staff"
  | "plans"
  | "payments"
  | "organization"
  | "settings";

export type OpsNavContext = {
  role: Role;
  canManageSettings: boolean;
  canManageStaff: boolean;
};

export type OpsNavItemDef = {
  id: OpsNavId;
  /** Path under the locale prefix, e.g. `/dashboard` */
  path: string;
  icon: LucideIcon;
  getLabel: (d: Dictionary) => string;
  visible: (ctx: OpsNavContext) => boolean;
  /** Never shown as a bottom primary tab */
  moreOnly?: boolean;
};

/**
 * Priority order for mobile bottom tabs.
 * Max 3 destinations + center My QR + More (so bars stay tappable).
 */
export const OPS_PRIMARY_TAB_ORDER: OpsNavId[] = [
  "dashboard",
  "checkin",
  "members",
  "classes",
  "payments",
];

export const MAX_PRIMARY_TABS = 3;

export const OPS_NAV_ITEMS: OpsNavItemDef[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    getLabel: (d) => d.nav.dashboard,
    visible: () => true,
  },
  {
    id: "checkin",
    path: "/checkin",
    icon: QrCode,
    getLabel: (d) => d.nav.checkin,
    visible: ({ role }) => can(role, "checkin"),
  },
  {
    id: "members",
    path: "/members",
    icon: Users,
    getLabel: (d) => d.nav.members,
    visible: ({ role }) => can(role, "manage_members"),
  },
  {
    id: "classes",
    path: "/classes",
    icon: CalendarDays,
    getLabel: (d) => d.nav.classes,
    visible: ({ role }) => can(role, "manage_classes") || can(role, "checkin"),
  },
  {
    id: "trainers",
    path: "/trainers",
    icon: Dumbbell,
    getLabel: (d) => d.nav.trainers,
    visible: ({ role, canManageStaff }) =>
      canManageStaff || can(role, "manage_staff"),
    moreOnly: true,
  },
  {
    id: "staff",
    path: "/staff",
    icon: Briefcase,
    getLabel: (d) => d.nav.staff,
    visible: ({ role, canManageStaff }) =>
      canManageStaff || can(role, "manage_staff"),
    moreOnly: true,
  },
  {
    id: "plans",
    path: "/plans",
    icon: Layers,
    getLabel: (d) => d.nav.plans,
    visible: ({ role }) => can(role, "manage_plans"),
    moreOnly: true,
  },
  {
    id: "payments",
    path: "/payments",
    icon: CreditCard,
    getLabel: (d) => d.nav.payments,
    visible: ({ role }) => can(role, "record_payment"),
  },
  {
    id: "organization",
    path: "/organization",
    icon: Building2,
    getLabel: (d) => d.shell.gymAdmin,
    visible: ({ canManageSettings }) => canManageSettings,
    moreOnly: true,
  },
  {
    id: "settings",
    path: "/settings",
    icon: Settings,
    getLabel: (d) => d.nav.settings,
    visible: ({ canManageSettings }) => canManageSettings,
    moreOnly: true,
  },
];

/** Main sidebar destinations (excludes org/settings — those live in footer / header). */
export function getSidebarOpsNavItems(ctx: OpsNavContext): OpsNavItemDef[] {
  return OPS_NAV_ITEMS.filter(
    (item) =>
      item.visible(ctx) &&
      item.id !== "organization" &&
      item.id !== "settings",
  );
}

export function getVisibleOpsNavItems(ctx: OpsNavContext): OpsNavItemDef[] {
  return OPS_NAV_ITEMS.filter((item) => item.visible(ctx));
}

export function splitMobileOpsNav(visible: OpsNavItemDef[]): {
  primary: OpsNavItemDef[];
  more: OpsNavItemDef[];
} {
  const primary: OpsNavItemDef[] = [];
  for (const id of OPS_PRIMARY_TAB_ORDER) {
    if (primary.length >= MAX_PRIMARY_TABS) break;
    const item = visible.find((v) => v.id === id && !v.moreOnly);
    if (item) primary.push(item);
  }
  const primaryIds = new Set(primary.map((p) => p.id));
  const more = visible.filter((v) => !primaryIds.has(v.id));
  return { primary, more };
}

export function opsNavHref(localePrefix: string, path: string): string {
  return `${localePrefix}${path}`;
}

export function isOpsNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
