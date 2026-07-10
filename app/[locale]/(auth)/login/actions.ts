"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  emailSchema,
  formString,
  localeSchema,
} from "@/lib/validation/schemas";

export type LoginState = { error?: string } | null;

const loginSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const localeRaw = formString(formData, "locale") || "es";
  const localeParsed = localeSchema.safeParse(localeRaw);
  const locale = localeParsed.success ? localeParsed.data : "es";

  const parsed = loginSchema.safeParse({
    locale: localeRaw,
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) {
    return { error: "invalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { error: "invalid" };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}
