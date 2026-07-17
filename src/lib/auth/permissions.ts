import type { Role, Workspace } from "$lib/types";

export type AppAction =
  | "manage_members"
  | "manage_plans"
  | "manage_classes"
  | "record_payment"
  | "checkin"
  | "view_dashboard"
  | "manage_staff"
  | "manage_billing"
  | "use_timers";

const roleMatrix: Record<Role, AppAction[]> = {
  OWNER: [
    "manage_members",
    "manage_plans",
    "manage_classes",
    "record_payment",
    "checkin",
    "view_dashboard",
    "manage_staff",
    "manage_billing",
    "use_timers",
  ],
  TRAINER: ["view_dashboard", "manage_classes", "use_timers"],
  STAFF: [
    "manage_members",
    "manage_plans",
    "manage_classes",
    "record_payment",
    "checkin",
    "view_dashboard",
    "use_timers",
  ],
};

export function can(role: Role | null | undefined, action: AppAction): boolean {
  if (!role) return false;
  return roleMatrix[role]?.includes(action) ?? false;
}

/** Prefer this when provisional owners need owner-level actions. */
export function canInWorkspace(
  workspace: Workspace | null | undefined,
  action: AppAction,
): boolean {
  if (!workspace) return false;
  if (workspace.canActAsOwner) {
    return roleMatrix.OWNER.includes(action);
  }
  return can(workspace.role, action);
}
