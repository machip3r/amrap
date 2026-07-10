"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { memberStatusFromExpires, computeRenewedExpiry } from "@/lib/members/dates";
import {
  formString,
  localeSchema,
  nonEmptyString,
  optionalTrimmed,
  paymentMethodSchema,
  uuidSchema,
} from "@/lib/validation/schemas";
import { toDbMemberStatus, toDbPaymentMethod } from "@/lib/validation/db-enums";
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
  name: nonEmptyString(120),
  phone: optionalTrimmed(40),
  membership_expires_at: z.string().min(1),
});

export async function createMember(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const profile = await getProfile();
  if (!profile || !can(profile.role, "manage_members")) {
    fail(`/${locale}/members`);
  }

  const parsed = createMemberSchema.safeParse({
    locale: formString(formData, "locale") || "es",
    name: formString(formData, "name"),
    phone: formString(formData, "phone"),
    membership_expires_at: formString(formData, "membership_expires_at"),
  });
  if (!parsed.success) fail(`/${locale}/members`);

  const expires = new Date(parsed.data.membership_expires_at);
  if (Number.isNaN(expires.getTime())) fail(`/${locale}/members`);

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    tenant_id: profile.tenant_id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    membership_expires_at: expires.toISOString(),
    status: toDbMemberStatus(memberStatusFromExpires(expires)),
    qr_code: randomUUID(),
  });

  if (error) {
    console.error("createMember", error.message);
    fail(`/${locale}/members`);
  }

  revalidatePath(`/${locale}/members`, "page");
}

export async function deleteMemberAction(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const profile = await getProfile();
  if (!profile || !can(profile.role, "manage_members")) {
    fail(`/${locale}/members`);
  }

  const idParsed = uuidSchema.safeParse(formString(formData, "member_id"));
  if (!idParsed.success) fail(`/${locale}/members`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", idParsed.data)
    .eq("tenant_id", profile!.tenant_id);

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
  const profile = await getProfile();
  const memberId = formString(formData, "member_id");
  const back = `/${locale}/members/${memberId || ""}`;

  if (!profile || !can(profile.role, "manage_members")) {
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
    .select("id, price, duration_days, tenant_id")
    .eq("id", parsed.data.plan_id)
    .eq("tenant_id", profile!.tenant_id)
    .maybeSingle();

  if (planErr || !plan) fail(back);

  const { data: member, error: memErr } = await supabase
    .from("members")
    .select("id, membership_expires_at, tenant_id")
    .eq("id", parsed.data.member_id)
    .eq("tenant_id", profile!.tenant_id)
    .maybeSingle();

  if (memErr || !member) fail(back);

  const newExpires = computeRenewedExpiry(
    new Date(member!.membership_expires_at),
    plan!.duration_days,
  );

  const { error: payErr } = await supabase.from("payments").insert({
    tenant_id: profile!.tenant_id,
    member_id: member!.id,
    amount: plan!.price,
    method: toDbPaymentMethod(parsed.data.method),
  });
  if (payErr) {
    console.error("renewMember payment", payErr.message);
    fail(back);
  }

  const { error: upErr } = await supabase
    .from("members")
    .update({
      membership_expires_at: newExpires.toISOString(),
      status: toDbMemberStatus(memberStatusFromExpires(newExpires)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", member!.id)
    .eq("tenant_id", profile!.tenant_id);

  if (upErr) {
    console.error("renewMember update", upErr.message);
    fail(back);
  }

  revalidatePath(`/${locale}/members`, "page");
  revalidatePath(`/${locale}/members/${member!.id}`, "page");
  revalidatePath(`/${locale}/payments`, "page");
  revalidatePath(`/${locale}/dashboard`, "page");
  redirect(`/${locale}/members/${member!.id}`);
}
