import type { MemberStatus, PaymentMethod } from "@/types";

/** DB CHECK: method in ('CASH','TRANSFER') */
export type DbPaymentMethod = "CASH" | "TRANSFER";

/** DB CHECK: status in ('ACTIVE','INACTIVE','EXPIRED','CANCELLED') */
export type DbMemberStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";

export function toDbPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  return method === "cash" ? "CASH" : "TRANSFER";
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

export function toDbMemberStatus(status: MemberStatus): DbMemberStatus {
  return status === "active" ? "ACTIVE" : "EXPIRED";
}
