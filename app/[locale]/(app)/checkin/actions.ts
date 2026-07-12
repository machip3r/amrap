"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import { checkInCodeSchema } from "@/lib/validation/schemas";

export type CheckinResult =
  | { status: "ok" }
  | { status: "denied" }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "empty" }
  | { status: "busy" }
  | { status: "error" };

export async function runCheckIn(raw: string): Promise<CheckinResult> {
  const parsed = checkInCodeSchema.safeParse(raw);
  if (!parsed.success) return { status: "empty" };
  const trimmed = parsed.data;

  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "checkin")) {
    return { status: "forbidden" };
  }

  const supabase = await createClient();

  const byQr = await supabase.rpc("record_check_in", {
    p_gym_id: workspace.gymId,
    p_qr_code: trimmed,
    p_membership_id: null,
    p_branch_id: null,
    p_source: "QR",
  });

  if (!byQr.error && byQr.data) {
    revalidatePath("/", "layout");
    return { status: "ok" };
  }

  const byMembership = await supabase.rpc("record_check_in", {
    p_gym_id: workspace.gymId,
    p_qr_code: null,
    p_membership_id: trimmed,
    p_branch_id: null,
    p_source: "MANUAL",
  });

  if (!byMembership.error && byMembership.data) {
    revalidatePath("/", "layout");
    return { status: "ok" };
  }

  return mapCheckInError(
    byMembership.error?.message ?? byQr.error?.message ?? "error",
  );
}

function mapCheckInError(message: string): CheckinResult {
  const m = message.toLowerCase();
  if (m.includes("not found") || m.includes("invalid input syntax")) {
    return { status: "not_found" };
  }
  if (m.includes("inactive") || m.includes("expired")) return { status: "denied" };
  if (m.includes("already in use") || m.includes("another gym")) {
    return { status: "busy" };
  }
  if (m.includes("not allowed")) return { status: "forbidden" };
  console.error("runCheckIn", message);
  return { status: "error" };
}
