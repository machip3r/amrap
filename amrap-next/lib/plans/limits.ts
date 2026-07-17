import type { OrgPlanTier } from "@/types";

/** Max active membership plans per gym. `null` = unlimited. */
export function maxActivePlans(tier: OrgPlanTier): number | null {
  switch (tier) {
    case "FREEMIUM":
      return 2;
    default:
      return null;
  }
}

export function canCreatePlan(
  tier: OrgPlanTier,
  activePlanCount: number,
): boolean {
  const max = maxActivePlans(tier);
  if (max == null) return true;
  return activePlanCount < max;
}

/**
 * Soft cap on active members per gym (product / infra guard).
 * `null` = no product soft-cap (e.g. custom Pro).
 */
export function maxActiveMembers(tier: OrgPlanTier): number | null {
  switch (tier) {
    case "FREEMIUM":
      return 30;
    case "STARTER":
    case "GROWTH":
      return 500;
    case "PRO":
      return null;
    default:
      return 30;
  }
}

/**
 * Max gyms per organization for self-serve / product caps.
 * Growth = Multi-Gym flat (2–3). Pro = custom (agreement).
 */
export function maxGyms(tier: OrgPlanTier): number | null {
  switch (tier) {
    case "FREEMIUM":
    case "STARTER":
      return 1;
    case "GROWTH":
      return 3;
    case "PRO":
      return null;
    default:
      return 1;
  }
}

export function canCreateGym(tier: OrgPlanTier, gymCount: number): boolean {
  const max = maxGyms(tier);
  if (max == null) return true;
  return gymCount < max;
}

/**
 * Max STAFF + TRAINER seats per gym (OWNER does not count).
 * `null` = unlimited.
 */
export function maxStaffSeats(tier: OrgPlanTier): number | null {
  switch (tier) {
    case "FREEMIUM":
      return 2;
    case "STARTER":
    case "GROWTH":
      return 5;
    case "PRO":
      return null;
    default:
      return 2;
  }
}

export function canInviteStaff(
  tier: OrgPlanTier,
  currentStaffAndTrainerCount: number,
): boolean {
  const max = maxStaffSeats(tier);
  if (max == null) return true;
  return currentStaffAndTrainerCount < max;
}

/** Self-serve plans that can use in-app checkout when billing is wired. */
export function isSelfServePlan(tier: OrgPlanTier): boolean {
  return tier === "FREEMIUM" || tier === "STARTER" || tier === "GROWTH";
}

/** Custom logo + theme (white-label). Freemium stays on default AMRAP branding. */
export function canUseWhitelabel(tier: OrgPlanTier): boolean {
  return tier !== "FREEMIUM";
}

export const ORG_DELETION_RETENTION_DAYS = 30;

export type AmrapPlanOption = {
  tier: OrgPlanTier;
  priceMxnMonthly: number | null;
  priceUsdMonthly: number | null;
  priceNote: "free" | "per_org" | "per_gym" | "contact";
};

/** List prices. Starter sits in the $799–$899 MXN / ~$42 USD band. */
export const AMRAP_PLANS: AmrapPlanOption[] = [
  {
    tier: "FREEMIUM",
    priceMxnMonthly: 0,
    priceUsdMonthly: 0,
    priceNote: "free",
  },
  {
    tier: "STARTER",
    priceMxnMonthly: 849,
    priceUsdMonthly: 42,
    priceNote: "per_org",
  },
  {
    tier: "GROWTH",
    priceMxnMonthly: 1499,
    priceUsdMonthly: 73,
    priceNote: "per_org",
  },
  {
    tier: "PRO",
    priceMxnMonthly: null,
    priceUsdMonthly: null,
    priceNote: "contact",
  },
];
