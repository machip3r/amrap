import { getRequestEvent } from "$app/server";
import { createClient } from "$lib/supabase/server";
import { createServiceRoleClient } from "$lib/supabase/admin";
import { getSessionUser } from "$lib/auth/session";
import type { Locale } from "$lib/i18n/config";

type PendingInviteKind = "team" | "member";

export type PendingInvite = {
  kind: PendingInviteKind;
  rowId: string;
  gymId: string;
  gymName: string;
  /** STAFF | TRAINER for team; MEMBER for member invites. */
  role: "STAFF" | "TRAINER" | "MEMBER";
};

type GymEmbed = { id: string; name: string };

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function db() {
  const admin = createServiceRoleClient();
  return admin;
}

/**
 * Pending invite awaiting accept/decline for the signed-in user.
 * Uses service role so pending invitees can still read gym name before accept.
 * Memoized on `event.locals` for the duration of one request.
 */
export async function getPendingInvite(): Promise<PendingInvite | null> {
  let locals: App.Locals | null = null;
  try {
    locals = getRequestEvent().locals;
  } catch {
    locals = null;
  }
  if (locals?.pendingInviteResolved) {
    return locals.pendingInvite ?? null;
  }

  const finish = (invite: PendingInvite | null) => {
    if (locals) {
      locals.pendingInviteResolved = true;
      locals.pendingInvite = invite;
    }
    return invite;
  };

  const user = await getSessionUser();
  if (!user) return finish(null);

  const admin = db();
  const supabase = admin ?? createClient();

  const { data: roleRow, error: roleErr } = await supabase
    .from("gym_roles")
    .select("id, role, gym_id, gyms ( id, name )")
    .eq("user_id", user.id)
    .in("role", ["STAFF", "TRAINER"])
    .eq("invite_status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roleErr) {
    console.error("getPendingInvite roles", roleErr.message);
  }

  if (roleRow) {
    const gym = firstEmbed(roleRow.gyms as GymEmbed | GymEmbed[] | null);
    return finish({
      kind: "team",
      rowId: roleRow.id as string,
      gymId: (roleRow.gym_id as string) ?? gym?.id ?? "",
      gymName: gym?.name?.trim() || "—",
      role: roleRow.role as "STAFF" | "TRAINER",
    });
  }

  const { data: person } = await supabase
    .from("persons")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!person) return finish(null);

  const { data: membership, error: memErr } = await supabase
    .from("memberships")
    .select("id, gym_id, gyms ( id, name )")
    .eq("person_id", person.id)
    .eq("invite_status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (memErr) {
    console.error("getPendingInvite memberships", memErr.message);
  }

  if (!membership) return finish(null);

  const gym = firstEmbed(membership.gyms as GymEmbed | GymEmbed[] | null);
  return finish({
    kind: "member",
    rowId: membership.id as string,
    gymId: (membership.gym_id as string) ?? gym?.id ?? "",
    gymName: gym?.name?.trim() || "—",
    role: "MEMBER",
  });
}

export function invitePath(locale: Locale): string {
  return `/${locale}/invite`;
}

export function invitePasswordPath(locale: Locale): string {
  return `/${locale}/invite/password`;
}

export async function acceptPendingInvite(
  invite: PendingInvite,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "not_authenticated" };

  const admin = db();
  const supabase = admin ?? (await createClient());
  const now = new Date().toISOString();

  if (invite.kind === "team") {
    const { data, error } = await supabase
      .from("gym_roles")
      .update({
        invite_status: "accepted",
        invite_responded_at: now,
      })
      .eq("id", invite.rowId)
      .eq("user_id", user.id)
      .eq("invite_status", "pending")
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("acceptPendingInvite team", error?.message);
      return { ok: false, message: error?.message ?? "update_failed" };
    }
    return { ok: true };
  }

  const { data: person } = await supabase
    .from("persons")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!person) return { ok: false, message: "no_person" };

  const { data, error } = await supabase
    .from("memberships")
    .update({
      invite_status: "accepted",
      invite_responded_at: now,
    })
    .eq("id", invite.rowId)
    .eq("person_id", person.id)
    .eq("invite_status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("acceptPendingInvite member", error?.message);
    return { ok: false, message: error?.message ?? "update_failed" };
  }
  return { ok: true };
}

export async function declinePendingInvite(
  invite: PendingInvite,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "not_authenticated" };

  const admin = db();
  const supabase = admin ?? (await createClient());
  const now = new Date().toISOString();

  if (invite.kind === "team") {
    const { data, error } = await supabase
      .from("gym_roles")
      .update({
        invite_status: "cancelled",
        invite_responded_at: now,
      })
      .eq("id", invite.rowId)
      .eq("user_id", user.id)
      .eq("invite_status", "pending")
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("declinePendingInvite team", error?.message);
      return { ok: false, message: error?.message ?? "update_failed" };
    }
    return { ok: true };
  }

  const { data: person } = await supabase
    .from("persons")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!person) return { ok: false, message: "no_person" };

  const { data, error } = await supabase
    .from("memberships")
    .update({
      invite_status: "cancelled",
      invite_responded_at: now,
    })
    .eq("id", invite.rowId)
    .eq("person_id", person.id)
    .eq("invite_status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("declinePendingInvite member", error?.message);
    return { ok: false, message: error?.message ?? "update_failed" };
  }
  return { ok: true };
}
