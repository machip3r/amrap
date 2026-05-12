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

export async function createPayment(formData: FormData): Promise<void> {
  const profile = await requireTenant();
  if (!can(profile.role, "record_payment")) {
    return;
  }

  const locale = String(formData.get("locale") ?? "es");
  const member_id = String(formData.get("member_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "cash") as "cash" | "transfer";

  if (!member_id || !Number.isFinite(amount) || amount < 0) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    tenant_id: profile.tenant_id,
    member_id,
    amount,
    method,
  });

  if (error) return;

  revalidatePath(`/${locale}/payments`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}
