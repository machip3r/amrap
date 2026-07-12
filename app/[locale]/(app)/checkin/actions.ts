"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import { checkInCodeSchema } from "@/lib/validation/schemas";

export type CheckinMember = {
  name: string;
  planName: string | null;
  expiresAt: string;
  weekCheckIns: number;
};

export type CheckinResult =
  | { status: "ok"; member: CheckinMember | null }
  | { status: "denied" }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "empty" }
  | { status: "busy" }
  | { status: "error" };

type PersonEmbed = { full_name: string } | { full_name: string }[] | null;
type PlanEmbed = { name: string } | { name: string }[] | null;
type MembershipEmbed =
  | { expires_at: string; person_id: string; plans: PlanEmbed }
  | { expires_at: string; person_id: string; plans: PlanEmbed }[]
  | null;

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function loadMemberFromCheckIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checkInId: string,
  gymId: string,
): Promise<CheckinMember | null> {
  const { data } = await supabase
    .from("check_ins")
    .select(
      `
      person_id,
      persons ( full_name ),
      memberships (
        expires_at,
        person_id,
        plans ( name )
      )
    `,
    )
    .eq("id", checkInId)
    .eq("gym_id", gymId)
    .maybeSingle();

  if (!data) return null;

  const person = firstEmbed(data.persons as PersonEmbed);
  const membership = firstEmbed(data.memberships as MembershipEmbed);
  const plan = firstEmbed(membership?.plans ?? null);
  const personId = (data.person_id as string) || membership?.person_id;
  if (!person?.full_name || !membership?.expires_at) return null;

  let weekCheckIns = 0;
  if (personId) {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    const { count } = await supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId)
      .eq("person_id", personId)
      .gte("checked_in_at", weekStart.toISOString());
    weekCheckIns = count ?? 0;
  }

  return {
    name: person.full_name,
    planName: plan?.name ?? null,
    expiresAt: membership.expires_at,
    weekCheckIns,
  };
}

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
    const member = await loadMemberFromCheckIn(
      supabase,
      byQr.data as string,
      workspace.gymId,
    );
    return { status: "ok", member };
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
    const member = await loadMemberFromCheckIn(
      supabase,
      byMembership.data as string,
      workspace.gymId,
    );
    return { status: "ok", member };
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
