"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_GYM_COOKIE,
  getOnboardingState,
  getSessionUser,
} from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  amountSchema,
  durationDaysSchema,
  entityNameSchema,
  formString,
  localeSchema,
  optionalAddressSchema,
  optionalEntityNameSchema,
  personNameSchema,
  uuidSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { z } from "zod";

export type OnboardingActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

function localeFrom(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

const profileSchema = z.object({
  locale: localeSchema,
  fullName: personNameSchema,
  roleIntent: z.enum(["owner", "manager"]),
});

export async function saveOnboardingProfileAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const locale = localeFrom(formData);
  const d = getDictionary(locale);

  const user = await getSessionUser();
  if (!user) return { error: d.onboarding.errorAuth };

  const parsed = profileSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    fullName: formString(formData, "fullName"),
    roleIntent: formString(formData, "roleIntent") || "owner",
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("onboarding_save_profile", {
    p_full_name: parsed.data.fullName,
    p_as_provisional_owner: parsed.data.roleIntent === "manager",
  });

  if (error) {
    console.error("saveOnboardingProfileAction", error.message);
    return { error: d.onboarding.errorSave };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

const gymSchema = z.object({
  locale: localeSchema,
  gymName: entityNameSchema,
  gymAddress: optionalAddressSchema,
  branchName: optionalEntityNameSchema,
  branchAddress: optionalAddressSchema,
});

export async function saveOnboardingGymAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const locale = localeFrom(formData);
  const d = getDictionary(locale);

  const user = await getSessionUser();
  if (!user) return { error: d.onboarding.errorAuth };

  const parsed = gymSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    gymName: formString(formData, "gymName"),
    gymAddress: formString(formData, "gymAddress"),
    branchName: formString(formData, "branchName"),
    branchAddress: formString(formData, "branchAddress"),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const supabase = await createClient();
  const { data: gymId, error } = await supabase.rpc("onboarding_create_gym", {
    p_gym_name: parsed.data.gymName,
    p_branch_name: parsed.data.branchName || null,
    p_gym_address: parsed.data.gymAddress,
    p_branch_address: parsed.data.branchAddress,
  });

  if (error) {
    console.error("saveOnboardingGymAction", error.message);
    return { error: d.onboarding.errorSave };
  }

  if (gymId && typeof gymId === "string") {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_GYM_COOKIE, gymId, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

const planSchema = z.object({
  locale: localeSchema,
  name: entityNameSchema,
  price: amountSchema,
  duration_days: durationDaysSchema,
});

const updatePlanSchema = planSchema.extend({
  plan_id: uuidSchema,
});

export async function addOnboardingPlanAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const locale = localeFrom(formData);
  const d = getDictionary(locale);

  const state = await getOnboardingState();
  if (!state?.gymId) return { error: d.onboarding.errorSave };

  const parsed = planSchema.safeParse({
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
  const { count } = await supabase
    .from("plans")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", state.gymId)
    .eq("is_active", true);

  if ((count ?? 0) >= 2) {
    return { error: d.onboarding.planLimit };
  }

  const { error } = await supabase.from("plans").insert({
    gym_id: state.gymId,
    name: parsed.data.name,
    price: parsed.data.price,
    duration_days: parsed.data.duration_days,
    is_active: true,
  });

  if (error) {
    console.error("addOnboardingPlanAction", error.message);
    return { error: d.onboarding.errorSave };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

export async function updateOnboardingPlanAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const locale = localeFrom(formData);
  const d = getDictionary(locale);

  const state = await getOnboardingState();
  if (!state?.gymId) return { error: d.onboarding.errorSave };

  const parsed = updatePlanSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    plan_id: formString(formData, "plan_id"),
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
  const { error } = await supabase
    .from("plans")
    .update({
      name: parsed.data.name,
      price: parsed.data.price,
      duration_days: parsed.data.duration_days,
    })
    .eq("id", parsed.data.plan_id)
    .eq("gym_id", state.gymId)
    .eq("is_active", true);

  if (error) {
    console.error("updateOnboardingPlanAction", error.message);
    return { error: d.onboarding.errorSave };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

export async function deleteOnboardingPlanAction(
  formData: FormData,
): Promise<void> {
  const locale = localeFrom(formData);
  const state = await getOnboardingState();
  if (!state?.gymId) redirect(`/${locale}/onboarding`);

  const planId = formString(formData, "plan_id");
  const idParsed = uuidSchema.safeParse(planId);
  if (!idParsed.success) redirect(`/${locale}/onboarding`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("plans")
    .update({ is_active: false })
    .eq("id", idParsed.data)
    .eq("gym_id", state.gymId);

  if (error) {
    console.error("deleteOnboardingPlanAction", error.message);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

export async function skipOnboardingPlansAction(
  formData: FormData,
): Promise<void> {
  const locale = localeFrom(formData);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("onboarding_mark_plans_done");
  if (error) {
    console.error("skipOnboardingPlansAction", error.message);
    redirect(`/${locale}/onboarding?error=1`);
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/onboarding`);
}

export async function finishOnboardingAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const supabase = await createClient();
  await supabase.rpc("onboarding_complete");

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}

