"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  amountSchema,
  durationDaysSchema,
  formString,
  localeSchema,
  nonEmptyString,
  uuidSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

function localeFromForm(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

const createPlanSchema = z.object({
  locale: localeSchema,
  name: nonEmptyString(120),
  price: amountSchema,
  duration_days: durationDaysSchema,
});

export async function createPlan(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const profile = await getProfile();
  if (!profile || !can(profile.role, "manage_plans")) {
    redirect(`/${locale}/plans?error=1`);
  }

  const parsed = createPlanSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    name: formString(formData, "name"),
    price: formString(formData, "price"),
    duration_days: formString(formData, "duration_days"),
  });
  if (!parsed.success) redirect(`/${locale}/plans?error=1`);

  const supabase = await createClient();
  const { error } = await supabase.from("plans").insert({
    tenant_id: profile.tenant_id,
    name: parsed.data.name,
    price: parsed.data.price,
    duration_days: parsed.data.duration_days,
  });

  if (error) {
    console.error("createPlan", error.message);
    redirect(`/${locale}/plans?error=1`);
  }

  revalidatePath(`/${locale}/plans`, "page");
}

export async function deletePlan(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const profile = await getProfile();
  if (!profile || !can(profile.role, "manage_plans")) {
    redirect(`/${locale}/plans?error=1`);
  }

  const idParsed = uuidSchema.safeParse(formString(formData, "plan_id"));
  if (!idParsed.success) redirect(`/${locale}/plans?error=1`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", idParsed.data)
    .eq("tenant_id", profile.tenant_id);

  if (error) {
    console.error("deletePlan", error.message);
    redirect(`/${locale}/plans?error=1`);
  }

  revalidatePath(`/${locale}/plans`, "page");
}
