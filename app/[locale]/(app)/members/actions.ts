"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { memberStatusFromExpires, computeRenewedExpiry } from "@/lib/members/dates";

async function requireTenant() {
  const profile = await getProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}

export async function createMember(formData: FormData): Promise<void> {
  const profile = await requireTenant();
  if (!can(profile.role, "manage_members")) {
    return;
  }

  const locale = String(formData.get("locale") ?? "es");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const expiresRaw = String(formData.get("membership_expires_at") ?? "");
  const expires = expiresRaw ? new Date(expiresRaw) : new Date();
  if (!name) return;

  const status = memberStatusFromExpires(expires);
  const supabase = await createClient();
  const qr_code = randomUUID();

  const { error } = await supabase.from("members").insert({
    tenant_id: profile.tenant_id,
    name,
    phone,
    membership_expires_at: expires.toISOString(),
    status,
    qr_code,
  });

  if (error) return;

  revalidatePath(`/${locale}/members`, "page");
}

export async function deleteMember(memberId: string, locale: string) {
  const profile = await requireTenant();
  if (!can(profile.role, "manage_members")) {
    return { ok: false as const, error: "forbidden" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("tenant_id", profile.tenant_id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/${locale}/members`, "page");
  return { ok: true as const };
}

export async function deleteMemberAction(formData: FormData) {
  const memberId = String(formData.get("member_id") ?? "");
  const locale = String(formData.get("locale") ?? "es");
  const res = await deleteMember(memberId, locale);
  if (!res.ok) return;
  redirect(`/${locale}/members`);
}

export async function renewMember(formData: FormData): Promise<void> {
  const profile = await requireTenant();
  if (!can(profile.role, "manage_members")) {
    return;
  }

  const locale = String(formData.get("locale") ?? "es");
  const memberId = String(formData.get("member_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  const method = String(formData.get("method") ?? "cash") as "cash" | "transfer";

  const supabase = await createClient();

  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select("id, price, duration_days, tenant_id")
    .eq("id", planId)
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  if (planErr || !plan) return;

  const { data: member, error: memErr } = await supabase
    .from("members")
    .select("id, membership_expires_at, tenant_id")
    .eq("id", memberId)
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  if (memErr || !member) return;

  const newExpires = computeRenewedExpiry(
    new Date(member.membership_expires_at),
    plan.duration_days,
  );
  const newStatus = memberStatusFromExpires(newExpires);

  const { error: payErr } = await supabase.from("payments").insert({
    tenant_id: profile.tenant_id,
    member_id: member.id,
    amount: plan.price,
    method,
  });
  if (payErr) return;

  const { error: upErr } = await supabase
    .from("members")
    .update({
      membership_expires_at: newExpires.toISOString(),
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("tenant_id", profile.tenant_id);

  if (upErr) return;

  revalidatePath(`/${locale}/members`, "page");
  revalidatePath(`/${locale}/members/${member.id}`, "page");
  revalidatePath(`/${locale}/payments`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  redirect(`/${locale}/members/${member.id}`);
}
