import type { Role } from "@/types";

export type AppAction =
  | "manage_members"
  | "manage_plans"
  | "record_payment"
  | "checkin"
  | "view_dashboard";

const roleMatrix: Record<Role, AppAction[]> = {
  OWNER: [
    "manage_members",
    "manage_plans",
    "record_payment",
    "checkin",
    "view_dashboard",
  ],
  TRAINER: [
    "manage_members",
    "manage_plans",
    "record_payment",
    "checkin",
    "view_dashboard",
  ],
  STAFF: ["record_payment", "checkin", "view_dashboard"],
};

export function can(role: Role | null | undefined, action: AppAction): boolean {
  if (!role) return false;
  return roleMatrix[role]?.includes(action) ?? false;
}
