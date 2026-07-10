"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  amountSchema,
  formString,
  localeSchema,
  paymentMethodSchema,
  uuidSchema,
} from "@/lib/validation/schemas";
import { toDbPaymentMethod } from "@/lib/validation/db-enums";
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

export async function createPayment(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const profile = await getProfile();
  if (!profile || !can(profile.role, "record_payment")) {
    redirect(`/${locale}/payments?error=1`);
  }

  const parsed = createPaymentSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    member_id: formString(formData, "member_id"),
    amount: formString(formData, "amount"),
    method: formString(formData, "method") || "cash",
  });
  if (!parsed.success) redirect(`/${locale}/payments?error=1`);

  const supabase = await createClient();

  const { data: member, error: memErr } = await supabase
    .from("members")
    .select("id")
    .eq("id", parsed.data.member_id)
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  if (memErr || !member) redirect(`/${locale}/payments?error=1`);

  const { error } = await supabase.from("payments").insert({
    tenant_id: profile.tenant_id,
    member_id: member.id,
    amount: parsed.data.amount,
    method: toDbPaymentMethod(parsed.data.method),
  });

  if (error) {
    console.error("createPayment", error.message);
    redirect(`/${locale}/payments?error=1`);
  }

  revalidatePath(`/${locale}/payments`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
}
