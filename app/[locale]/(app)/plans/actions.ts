"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import {
  amountSchema,
  durationDaysSchema,
  entityNameSchema,
  formString,
  localeSchema,
  uuidSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { z } from "zod";

function localeFromForm(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

const createPlanSchema = z.object({
  locale: localeSchema,
  name: entityNameSchema,
  price: amountSchema,
  duration_days: durationDaysSchema,
});

export type CreatePlanState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function createPlan(
  _prev: CreatePlanState,
  formData: FormData,
): Promise<CreatePlanState> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_plans")) {
    return { error: d.common.forbidden };
  }

  const parsed = createPlanSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    name: formString(formData, "name"),
    price: formString(formData, "price"),
    duration_days: formString(formData, "duration_days"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: zodFieldErrors(parsed.error, d.validation, {
        name: "entityName",
      }),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("plans").insert({
    gym_id: workspace.gymId,
    name: parsed.data.name,
    price: parsed.data.price,
    duration_days: parsed.data.duration_days,
  });

  if (error) {
    console.error("createPlan", error.message);
    return { error: d.plans.error };
  }

  revalidatePath(`/${locale}/plans`, "page");
  return null;
}

export async function deletePlan(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_plans")) {
    redirect(`/${locale}/plans?error=1`);
  }

  const idParsed = uuidSchema.safeParse(formString(formData, "plan_id"));
  if (!idParsed.success) redirect(`/${locale}/plans?error=1`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", idParsed.data)
    .eq("gym_id", workspace.gymId);

  if (error) {
    console.error("deletePlan", error.message);
    redirect(`/${locale}/plans?error=1`);
  }

  revalidatePath(`/${locale}/plans`, "page");
}
