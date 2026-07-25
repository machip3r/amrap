import type { InviteStatus, MemberStatus, PaymentKind, PaymentMethod } from "$lib/types";

/** Normalize legacy lowercase DB reads to canonical UPPERCASE. */
export function upperEnum(raw: string | null | undefined): string {
  return (raw ?? "").trim().toUpperCase();
}

export function paymentMethodFromDb(raw: string): PaymentMethod | null {
  const u = upperEnum(raw);
  if (u === "CASH" || u === "TRANSFER") return u;
  return null;
}

export function paymentKindFromDb(raw: string | null | undefined): PaymentKind {
  return upperEnum(raw) === "DAY_PASS" ? "DAY_PASS" : "PLAN";
}

export function memberStatusFromDb(raw: string | null | undefined): MemberStatus {
  return upperEnum(raw) === "EXPIRED" ? "EXPIRED" : "ACTIVE";
}

export function inviteStatusFromDb(raw: string | null | undefined): InviteStatus {
  const u = upperEnum(raw);
  if (u === "PENDING" || u === "CANCELLED" || u === "ACCEPTED") return u;
  return "ACCEPTED";
}
