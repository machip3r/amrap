"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { memberStatusFromExpires } from "@/lib/members/dates";

export type CheckinResult =
  | { status: "ok" }
  | { status: "denied" }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "empty" }
  | { status: "error" };

export async function runCheckIn(raw: string): Promise<CheckinResult> {
  const trimmed = raw.trim();
  if (!trimmed) return { status: "empty" };
  if (trimmed.length > 200) return { status: "empty" };

  const profile = await getProfile();
  if (!profile || !can(profile.role, "checkin")) {
    return { status: "forbidden" };
  }

  const supabase = await createClient();

  const { data: byQr } = await supabase
    .from("members")
    .select("id, membership_expires_at, tenant_id")
    .eq("tenant_id", profile.tenant_id)
    .eq("qr_code", trimmed)
    .maybeSingle();

  let member = byQr;
  if (!member) {
    const { data } = await supabase
      .from("members")
      .select("id, membership_expires_at, tenant_id")
      .eq("tenant_id", profile.tenant_id)
      .eq("id", trimmed)
      .maybeSingle();
    member = data;
  }

  if (!member) {
    return { status: "not_found" };
  }

  const ok = memberStatusFromExpires(member.membership_expires_at) === "active";
  if (!ok) {
    return { status: "denied" };
  }

  const { error } = await supabase.from("check_ins").insert({
    tenant_id: profile.tenant_id,
    member_id: member.id,
  });

  if (error) {
    console.error("runCheckIn", error.message);
    return { status: "error" };
  }

  revalidatePath("/", "layout");
  return { status: "ok" };
}
