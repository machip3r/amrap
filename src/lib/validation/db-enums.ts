import type { MemberStatus, PaymentKind, PaymentMethod } from "$lib/types";

/** DB CHECK: method in ('CASH','TRANSFER') */
export type DbPaymentMethod = "CASH" | "TRANSFER";

/** DB CHECK: kind in ('PLAN','DAY_PASS') */
export type DbPaymentKind = "PLAN" | "DAY_PASS";

/** DB CHECK: status in ('ACTIVE','INACTIVE','EXPIRED','CANCELLED') */
export type DbMemberStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";

export function toDbPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  return method === "cash" ? "CASH" : "TRANSFER";
}

export function toDbPaymentKind(kind: PaymentKind): DbPaymentKind {
  return kind === "day_pass" ? "DAY_PASS" : "PLAN";
}

function parsePaymentMethod(raw: string): PaymentMethod | null {
  const v = raw.trim().toLowerCase();
  if (v === "cash") return "cash";
  if (v === "transfer") return "transfer";
  return null;
}

export function paymentMethodFromDb(raw: string): PaymentMethod | null {
  const u = raw.trim().toUpperCase();
  if (u === "CASH") return "cash";
  if (u === "TRANSFER") return "transfer";
  return parsePaymentMethod(raw);
}

export function paymentKindFromDb(raw: string | null | undefined): PaymentKind {
  const u = (raw ?? "PLAN").trim().toUpperCase();
  return u === "DAY_PASS" ? "day_pass" : "plan";
}

export function toDbMemberStatus(status: MemberStatus): DbMemberStatus {
  return status === "active" ? "ACTIVE" : "EXPIRED";
}
