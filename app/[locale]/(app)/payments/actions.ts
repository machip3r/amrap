"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import {
  amountSchema,
  formString,
  localeSchema,
  paymentMethodSchema,
  uuidSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { toDbPaymentMethod } from "@/lib/validation/db-enums";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { z } from "zod";

function localeFromForm(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

const createPaymentSchema = z.object({
  locale: localeSchema,
  member_id: uuidSchema,
  amount: amountSchema,
  method: paymentMethodSchema,
});

export type CreatePaymentState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function createPayment(
  _prev: CreatePaymentState,
  formData: FormData,
): Promise<CreatePaymentState> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "record_payment")) {
    return { error: d.common.forbidden };
  }

  const parsed = createPaymentSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    member_id: formString(formData, "member_id"),
    amount: formString(formData, "amount"),
    method: formString(formData, "method") || "cash",
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const supabase = await createClient();

  const { data: membership, error: memErr } = await supabase
    .from("memberships")
    .select("id")
    .eq("id", parsed.data.member_id)
    .eq("gym_id", workspace.gymId)
    .maybeSingle();

  if (memErr || !membership) {
    return { fieldErrors: { member_id: d.validation.invalid } };
  }

  const { error } = await supabase.from("payments").insert({
    gym_id: workspace.gymId,
    membership_id: membership.id,
    amount: parsed.data.amount,
    method: toDbPaymentMethod(parsed.data.method),
    recorded_by: workspace.userId,
  });

  if (error) {
    console.error("createPayment", error.message);
    return { error: d.payments.error };
  }

  revalidatePath(`/${locale}/payments`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  return null;
}
