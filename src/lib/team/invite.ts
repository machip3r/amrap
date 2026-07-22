import type { Locale } from "$lib/i18n/config";
import { getRequestOrigin } from "$lib/http/origin";
import { createServiceRoleClient } from "$lib/supabase/admin";
import { personUniqueFieldFromError } from "$lib/supabase/errors";
import { sendEmail } from "$lib/email/resend";
import {
  buildExistingUserMemberEmail,
  buildExistingUserTeamEmail,
  buildMemberInviteEmail,
  buildTeamInviteEmail,
} from "$lib/email/invite-templates";

export type AuthInviteResult =
  | {
      ok: true;
      userId: string;
      isNewInvite: boolean;
      emailSent: boolean;
      emailSkipped?: boolean;
      emailError?: string;
    }
  | { ok: false; message: string };

type InviteKind = "team" | "member";

function confirmUrl(
  origin: string,
  tokenHash: string,
  type: "invite" | "magiclink",
  nextPath: string,
) {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
    next: nextPath,
  });
  return `${origin}/auth/confirm?${params.toString()}`;
}

/**
 * Creates or resolves an auth user for `email`, optionally links invite metadata,
 * and sends a Resend invitation (or login notice for existing accounts).
 */
export async function inviteAuthUserByEmail(opts: {
  email: string;
  fullName: string;
  locale: Locale;
  gymName: string;
  kind: InviteKind;
  /** Used for team invites (display in email). */
  roleLabel?: string;
  /** Where to land after confirm — relative path starting with / */
  nextPath: string;
}): Promise<AuthInviteResult> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const origin = getRequestOrigin();
  const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent(opts.nextPath)}`;
  const email = opts.email.trim().toLowerCase();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { full_name: opts.fullName },
        redirectTo,
      },
    });

  if (!inviteError && inviteData?.user?.id && inviteData.properties?.hashed_token) {
    await admin.auth.admin.updateUserById(inviteData.user.id, {
      app_metadata: { amrap_needs_invite_password: true },
    });

    const acceptUrl = confirmUrl(
      origin,
      inviteData.properties.hashed_token,
      "invite",
      opts.nextPath,
    );
    const template =
      opts.kind === "member"
        ? buildMemberInviteEmail({
            locale: opts.locale,
            gymName: opts.gymName,
            acceptUrl,
          })
        : buildTeamInviteEmail({
            locale: opts.locale,
            gymName: opts.gymName,
            roleLabel: opts.roleLabel ?? "staff",
            acceptUrl,
          });

    const mail = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    return {
      ok: true,
      userId: inviteData.user.id,
      isNewInvite: true,
      emailSent: mail.ok,
      emailSkipped: !mail.ok && "skipped" in mail ? mail.skipped : undefined,
      emailError: mail.ok ? undefined : mail.message,
    };
  }

  // User likely already registered — create a magic link or fall back to login URL.
  const { data: magicData, error: magicError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

  if (magicError || !magicData?.user?.id) {
    console.error(
      "inviteAuthUserByEmail",
      inviteError?.message,
      magicError?.message,
    );
    return {
      ok: false,
      message: inviteError?.message ?? magicError?.message ?? "Invite failed",
    };
  }

  await admin.auth.admin.updateUserById(magicData.user.id, {
    app_metadata: { amrap_needs_invite_password: false },
  });

  const hashed = magicData.properties?.hashed_token;
  const acceptUrl = hashed
    ? confirmUrl(origin, hashed, "magiclink", opts.nextPath)
    : `${origin}${opts.nextPath.startsWith("/") ? "" : "/"}${opts.locale}/login`;

  // Prefer dedicated login landing for existing users when magic link unavailable.
  const loginUrl = `${origin}/${opts.locale}/login`;
  const href = hashed ? acceptUrl : loginUrl;

  const template =
    opts.kind === "member"
      ? buildExistingUserMemberEmail({
          locale: opts.locale,
          gymName: opts.gymName,
          loginUrl: href,
        })
      : buildExistingUserTeamEmail({
          locale: opts.locale,
          gymName: opts.gymName,
          roleLabel: opts.roleLabel ?? "staff",
          loginUrl: href,
        });

  const mail = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });

  return {
    ok: true,
    userId: magicData.user.id,
    isNewInvite: false,
    emailSent: mail.ok,
    emailSkipped: !mail.ok && "skipped" in mail ? mail.skipped : undefined,
    emailError: mail.ok ? undefined : mail.message,
  };
}

/**
 * Ensures a persons row exists for the invited auth user.
 */
export async function upsertPersonForUser(opts: {
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
}): Promise<
  | { ok: true; personId: string }
  | { ok: false; message: string; uniqueField?: "email" | "phone" | "user_id" | "qr_code" }
> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data, error } = await admin
    .from("persons")
    .upsert(
      {
        user_id: opts.userId,
        full_name: opts.fullName,
        email: opts.email.trim().toLowerCase(),
        phone: opts.phone || null,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    console.error("upsertPersonForUser", error?.message);
    const uniqueField = personUniqueFieldFromError(error) ?? undefined;
    return {
      ok: false,
      message: error?.message ?? "person upsert failed",
      uniqueField: uniqueField ?? undefined,
    };
  }

  return { ok: true, personId: data.id };
}

/**
 * Links an existing staff-created person (no user_id) to an auth user.
 * No-op if another person already owns that user_id.
 */
export async function linkPersonToUser(opts: {
  personId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, message: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: occupied } = await admin
    .from("persons")
    .select("id")
    .eq("user_id", opts.userId)
    .maybeSingle();

  if (occupied && occupied.id !== opts.personId) {
    // Auth user already linked elsewhere — leave membership person as-is.
    return { ok: true };
  }

  const { error } = await admin
    .from("persons")
    .update({ user_id: opts.userId })
    .eq("id", opts.personId)
    .is("user_id", null);

  if (error) {
    console.error("linkPersonToUser", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
