import { cookies } from "next/headers";
import { emailSchema, entityNameSchema } from "@/lib/validation/schemas";

export const PENDING_CONFIRM_EMAIL_COOKIE = "amrap_pending_confirm_email";
export const PENDING_ORG_NAME_COOKIE = "amrap_pending_org_name";

const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export async function getPendingConfirmEmail(): Promise<string | null> {
  const store = await cookies();
  const parsed = emailSchema.safeParse(store.get(PENDING_CONFIRM_EMAIL_COOKIE)?.value ?? "");
  return parsed.success ? parsed.data : null;
}

export async function getPendingOrganizationName(): Promise<string | null> {
  const store = await cookies();
  const parsed = entityNameSchema.safeParse(
    store.get(PENDING_ORG_NAME_COOKIE)?.value ?? "",
  );
  return parsed.success ? parsed.data : null;
}

export async function setPendingConfirmSignup(input: {
  email: string;
  organizationName: string;
}): Promise<void> {
  const emailParsed = emailSchema.safeParse(input.email);
  const orgParsed = entityNameSchema.safeParse(input.organizationName);
  if (!emailParsed.success || !orgParsed.success) return;
  const store = await cookies();
  const opts = {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
  };
  store.set(PENDING_CONFIRM_EMAIL_COOKIE, emailParsed.data, opts);
  store.set(PENDING_ORG_NAME_COOKIE, orgParsed.data, opts);
}

/** @deprecated Prefer setPendingConfirmSignup when org name is known. */
export async function setPendingConfirmEmail(email: string): Promise<void> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return;
  const store = await cookies();
  store.set(PENDING_CONFIRM_EMAIL_COOKIE, parsed.data, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearPendingConfirmEmail(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_CONFIRM_EMAIL_COOKIE);
  store.delete(PENDING_ORG_NAME_COOKIE);
}
