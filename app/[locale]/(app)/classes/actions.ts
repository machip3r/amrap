"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import {
  entityNameSchema,
  formString,
  localeSchema,
  uuidSchema,
  LIMITS,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { z } from "zod";

function localeFromForm(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(LIMITS.message)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalCapacitySchema = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 10_000) {
      ctx.addIssue({ code: "custom", message: "invalid" });
      return z.NEVER;
    }
    return n;
  });

const classFormSchema = z.object({
  locale: localeSchema,
  name: entityNameSchema,
  description: optionalDescriptionSchema,
  capacity: optionalCapacitySchema,
  trainer_ids: z.array(uuidSchema).default([]),
});

const updateClassSchema = classFormSchema.extend({
  class_id: uuidSchema,
});

export type ClassFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
} | null;

function trainerIdsFromForm(formData: FormData): string[] {
  return formData
    .getAll("trainer_ids")
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(Boolean);
}

async function assertTrainersInGym(
  gymId: string,
  trainerIds: string[],
): Promise<boolean> {
  if (trainerIds.length === 0) return true;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gym_roles")
    .select("user_id")
    .eq("gym_id", gymId)
    .eq("role", "TRAINER")
    .in("user_id", trainerIds);

  if (error) {
    console.error("assertTrainersInGym", error.message);
    return false;
  }
  const found = new Set((data ?? []).map((r) => r.user_id));
  return trainerIds.every((id) => found.has(id));
}

async function replaceClassTrainers(classId: string, trainerIds: string[]) {
  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("class_trainers")
    .delete()
    .eq("class_id", classId);
  if (delErr) {
    console.error("replaceClassTrainers delete", delErr.message);
    return false;
  }
  if (trainerIds.length === 0) return true;
  const { error: insErr } = await supabase.from("class_trainers").insert(
    trainerIds.map((user_id) => ({ class_id: classId, user_id })),
  );
  if (insErr) {
    console.error("replaceClassTrainers insert", insErr.message);
    return false;
  }
  return true;
}

export async function createClass(
  _prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_classes")) {
    return { error: d.common.forbidden };
  }

  const parsed = classFormSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    capacity: formString(formData, "capacity"),
    trainer_ids: trainerIdsFromForm(formData),
  });
  if (!parsed.success) {
    return {
      fieldErrors: zodFieldErrors(parsed.error, d.validation, {
        name: "entityName",
      }),
    };
  }

  const okTrainers = await assertTrainersInGym(
    workspace.gymId,
    parsed.data.trainer_ids,
  );
  if (!okTrainers) {
    return { fieldErrors: { trainer_ids: d.validation.invalid } };
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("classes")
    .insert({
      gym_id: workspace.gymId,
      name: parsed.data.name,
      description: parsed.data.description,
      capacity: parsed.data.capacity,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("createClass", error?.message);
    return { error: d.classes.error };
  }

  const assigned = await replaceClassTrainers(
    inserted.id,
    parsed.data.trainer_ids,
  );
  if (!assigned) {
    return { error: d.classes.error };
  }

  revalidatePath(`/${locale}/classes`, "page");
  return { success: true };
}

export async function updateClass(
  _prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_classes")) {
    return { error: d.common.forbidden };
  }

  const parsed = updateClassSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    class_id: formString(formData, "class_id"),
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    capacity: formString(formData, "capacity"),
    trainer_ids: trainerIdsFromForm(formData),
  });
  if (!parsed.success) {
    return {
      fieldErrors: zodFieldErrors(parsed.error, d.validation, {
        name: "entityName",
      }),
    };
  }

  const okTrainers = await assertTrainersInGym(
    workspace.gymId,
    parsed.data.trainer_ids,
  );
  if (!okTrainers) {
    return { fieldErrors: { trainer_ids: d.validation.invalid } };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      capacity: parsed.data.capacity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.class_id)
    .eq("gym_id", workspace.gymId);

  if (error) {
    console.error("updateClass", error.message);
    return { error: d.classes.error };
  }

  const assigned = await replaceClassTrainers(
    parsed.data.class_id,
    parsed.data.trainer_ids,
  );
  if (!assigned) {
    return { error: d.classes.error };
  }

  revalidatePath(`/${locale}/classes`, "page");
  return { success: true };
}

export async function setClassActive(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_classes")) {
    return;
  }

  const classId = formString(formData, "class_id");
  const idParsed = uuidSchema.safeParse(classId);
  const activeRaw = formString(formData, "is_active");
  if (!idParsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("classes")
    .update({
      is_active: activeRaw === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", idParsed.data)
    .eq("gym_id", workspace.gymId);

  revalidatePath(`/${locale}/classes`, "page");
}
