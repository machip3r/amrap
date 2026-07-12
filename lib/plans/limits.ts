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

/** Max gyms per organization. `null` = unlimited (practical). */
export function maxGyms(tier: OrgPlanTier): number | null {
  switch (tier) {
    case "FREEMIUM":
    case "STARTER":
      return 1;
    case "GROWTH":
      return 5;
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

export const ORG_DELETION_RETENTION_DAYS = 30;

export type AmrapPlanOption = {
  tier: OrgPlanTier;
  priceMxnMonthly: number | null;
  priceNote: "free" | "per_org" | "per_gym";
};

export const AMRAP_PLANS: AmrapPlanOption[] = [
  { tier: "FREEMIUM", priceMxnMonthly: 0, priceNote: "free" },
  { tier: "STARTER", priceMxnMonthly: 799, priceNote: "per_org" },
  { tier: "GROWTH", priceMxnMonthly: 599, priceNote: "per_gym" },
  { tier: "PRO", priceMxnMonthly: 699, priceNote: "per_gym" },
];
