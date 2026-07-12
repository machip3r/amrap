"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import {
  memberStatusFromExpires,
  computeRenewedExpiry,
} from "@/lib/members/dates";
import {
  formString,
  localeSchema,
  membershipExpiresSchema,
  optionalPhoneSchema,
  paymentMethodSchema,
  personNameSchema,
  uuidSchema,
} from "@/lib/validation/schemas";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { toDbMemberStatus, toDbPaymentMethod } from "@/lib/validation/db-enums";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { z } from "zod";

function localeFromForm(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

function fail(path: string): never {
  redirect(`${path}?error=1`);
}

const createMemberSchema = z.object({
  locale: localeSchema,
  name: personNameSchema,
  phone: optionalPhoneSchema,
  membership_expires_at: membershipExpiresSchema,
});

export type CreateMemberState = {
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function createMember(
  _prev: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_members")) {
    return { error: d.common.forbidden };
  }

  const parsed = createMemberSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    name: formString(formData, "name"),
    phone: formString(formData, "phone"),
    membership_expires_at: formString(formData, "membership_expires_at"),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error, d.validation) };
  }

  const expires = new Date(parsed.data.membership_expires_at);
  if (Number.isNaN(expires.getTime())) {
    return { fieldErrors: { membership_expires_at: d.validation.date } };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_gym_membership", {
    p_gym_id: workspace.gymId,
    p_full_name: parsed.data.name,
    p_expires_at: expires.toISOString(),
    p_phone: parsed.data.phone,
    p_email: null,
    p_branch_id: null,
    p_plan_id: null,
  });

  if (error) {
    console.error("createMember", error.message);
    return { error: d.members.error };
  }

  revalidatePath(`/${locale}/members`, "page");
  return null;
}

export async function deleteMemberAction(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const workspace = await getWorkspace();
  if (!workspace || !canInWorkspace(workspace, "manage_members")) {
    fail(`/${locale}/members`);
  }

  const idParsed = uuidSchema.safeParse(formString(formData, "member_id"));
  if (!idParsed.success) fail(`/${locale}/members`);

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, person_id")
    .eq("id", idParsed.data)
    .eq("gym_id", workspace.gymId)
    .maybeSingle();

  if (!membership) fail(`/${locale}/members`);

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membership.id)
    .eq("gym_id", workspace.gymId);

  if (error) {
    console.error("deleteMember", error.message);
    fail(`/${locale}/members/${idParsed.data}`);
  }

  revalidatePath(`/${locale}/members`, "page");
  redirect(`/${locale}/members`);
}

const renewSchema = z.object({
  locale: localeSchema,
  member_id: uuidSchema,
  plan_id: uuidSchema,
  method: paymentMethodSchema,
});

export async function renewMember(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const workspace = await getWorkspace();
  const memberId = formString(formData, "member_id");
  const back = `/${locale}/members/${memberId || ""}`;

  if (!workspace || !canInWorkspace(workspace, "manage_members")) {
    fail(back);
  }

  const parsed = renewSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    member_id: memberId,
    plan_id: formString(formData, "plan_id"),
    method: formString(formData, "method") || "cash",
  });
  if (!parsed.success) fail(back);

  const supabase = await createClient();

  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select("id, price, duration_days, gym_id")
    .eq("id", parsed.data.plan_id)
    .eq("gym_id", workspace.gymId)
    .maybeSingle();

  if (planErr || !plan) fail(back);

  const { data: membership, error: memErr } = await supabase
    .from("memberships")
    .select("id, expires_at, gym_id")
    .eq("id", parsed.data.member_id)
    .eq("gym_id", workspace.gymId)
    .maybeSingle();

  if (memErr || !membership) fail(back);

  const newExpires = computeRenewedExpiry(
    new Date(membership.expires_at),
    plan.duration_days,
  );

  const { error: payErr } = await supabase.from("payments").insert({
    gym_id: workspace.gymId,
    membership_id: membership.id,
    amount: plan.price,
    method: toDbPaymentMethod(parsed.data.method),
    recorded_by: workspace.userId,
  });
  if (payErr) {
    console.error("renewMember payment", payErr.message);
    fail(back);
  }

  const { error: upErr } = await supabase
    .from("memberships")
    .update({
      expires_at: newExpires.toISOString(),
      status: toDbMemberStatus(memberStatusFromExpires(newExpires)),
      plan_id: plan.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)
    .eq("gym_id", workspace.gymId);

  if (upErr) {
    console.error("renewMember update", upErr.message);
    fail(back);
  }

  revalidatePath(`/${locale}/members`, "page");
  revalidatePath(`/${locale}/members/${membership.id}`, "page");
  revalidatePath(`/${locale}/payments`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  redirect(`/${locale}/members/${membership.id}`);
}
