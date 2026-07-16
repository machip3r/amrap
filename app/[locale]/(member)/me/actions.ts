"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMemberContext, MEMBER_GYM_COOKIE } from "@/lib/auth/member-session";
import { formString, localeSchema, uuidSchema } from "@/lib/validation/schemas";
import { getDictionary } from "@/lib/i18n/dictionaries";

function localeFromForm(formData: FormData) {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  return localeParsed.success ? localeParsed.data : ("es" as const);
}

export async function bookSession(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const member = await getMemberContext();
  if (!member) return { error: d.common.forbidden };

  const sessionId = uuidSchema.safeParse(formString(formData, "session_id"));
  if (!sessionId.success) return { error: d.validation.invalid };

  const supabase = await createClient();
  const { error } = await supabase.rpc("book_class_session", {
    p_session_id: sessionId.data,
    p_person_id: null,
    p_membership_id: null,
  });
  if (error) {
    console.error("bookSession", error.message);
    return { error: d.member.bookError };
  }

  revalidatePath(`/${locale}/me/classes`, "page");
  return { success: true };
}

export async function cancelBooking(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const locale = localeFromForm(formData);
  const d = getDictionary(locale);
  const member = await getMemberContext();
  if (!member) return { error: d.common.forbidden };

  const bookingId = uuidSchema.safeParse(formString(formData, "booking_id"));
  if (!bookingId.success) return { error: d.validation.invalid };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_class_booking", {
    p_booking_id: bookingId.data,
  });
  if (error) {
    console.error("cancelBooking", error.message);
    return { error: d.member.cancelError };
  }

  revalidatePath(`/${locale}/me/classes`, "page");
  return { success: true };
}

export async function markInboxRead(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const member = await getMemberContext();
  if (!member) return;

  const messageId = uuidSchema.safeParse(formString(formData, "message_id"));
  if (!messageId.success) return;

  const supabase = await createClient();
  await supabase
    .from("inbox_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", messageId.data)
    .eq("recipient_person_id", member.personId)
    .is("read_at", null);

  revalidatePath(`/${locale}/me/inbox`, "page");
}

export async function switchMemberGym(formData: FormData): Promise<void> {
  const locale = localeFromForm(formData);
  const member = await getMemberContext();
  if (!member) return;

  const gymId = uuidSchema.safeParse(formString(formData, "gym_id"));
  if (!gymId.success) return;
  if (!member.gyms.some((g) => g.gymId === gymId.data)) return;

  const cookieStore = await cookies();
  cookieStore.set(MEMBER_GYM_COOKIE, gymId.data, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath(`/${locale}/me`, "layout");
}
