"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

async function requireTenant() {
  const profile = await getProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}

export async function createPlan(formData: FormData): Promise<void> {
  const profile = await requireTenant();
  if (!can(profile.role, "manage_plans")) {
    return;
  }

  const locale = String(formData.get("locale") ?? "es");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const duration_days = Number(formData.get("duration_days") ?? 0);

  if (!name || !Number.isFinite(price) || !Number.isFinite(duration_days) || duration_days <= 0) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("plans").insert({
    tenant_id: profile.tenant_id,
    name,
    price,
    duration_days,
  });

  if (error) return;

  revalidatePath(`/${locale}/plans`, "page");
}

export async function deletePlan(formData: FormData): Promise<void> {
  const profile = await requireTenant();
  if (!can(profile.role, "manage_plans")) {
    return;
  }

  const locale = String(formData.get("locale") ?? "es");
  const id = String(formData.get("plan_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", id)
    .eq("tenant_id", profile.tenant_id);

  if (error) return;

  revalidatePath(`/${locale}/plans`, "page");
}
