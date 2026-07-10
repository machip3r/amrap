import type { MemberStatus } from "@/types";

export function memberStatusFromExpires(
  membershipExpiresAt: string | Date,
): MemberStatus {
  const t =
    typeof membershipExpiresAt === "string"
      ? new Date(membershipExpiresAt)
      : membershipExpiresAt;
  return t > new Date() ? "active" : "expired";
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Renew from max(now, current expiry) + duration */
export function computeRenewedExpiry(
  currentExpiresAt: Date,
  durationDays: number,
): Date {
  const now = new Date();
  const start = currentExpiresAt > now ? currentExpiresAt : now;
  return addDays(start, durationDays);
}
