import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addDays,
  startOfWeekMonday,
  type ClassSessionRow,
} from "@/lib/classes/types";

export async function loadSessionsForWeek(
  supabase: SupabaseClient,
  gymId: string,
  weekStart: Date,
  opts?: { classId?: string; trainerUserId?: string },
): Promise<ClassSessionRow[]> {
  const from = startOfWeekMonday(weekStart);
  const to = addDays(from, 7);

  let query = supabase
    .from("class_sessions")
    .select(
      `
      id,
      class_id,
      gym_id,
      schedule_id,
      starts_at,
      ends_at,
      capacity,
      status,
      classes ( name )
    `,
    )
    .eq("gym_id", gymId)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at", { ascending: true });

  if (opts?.classId) {
    query = query.eq("class_id", opts.classId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("loadSessionsForWeek", error.message);
    return [];
  }

  let rows = data ?? [];

  if (opts?.trainerUserId) {
    const { data: links } = await supabase
      .from("class_trainers")
      .select("class_id")
      .eq("user_id", opts.trainerUserId);
    const allowed = new Set((links ?? []).map((l) => l.class_id as string));
    rows = rows.filter((r) => allowed.has(r.class_id as string));
  }

  // Confirmed-ish counts need a separate filter — PostgREST count is all bookings.
  const sessionIds = rows.map((r) => r.id as string);
  const confirmedBySession = new Map<string, number>();
  const waitlistBySession = new Map<string, number>();

  if (sessionIds.length > 0) {
    const { data: bookings } = await supabase
      .from("class_bookings")
      .select("session_id, status")
      .in("session_id", sessionIds)
      .neq("status", "cancelled");

    for (const b of bookings ?? []) {
      const sid = b.session_id as string;
      const st = b.status as string;
      if (st === "waitlisted") {
        waitlistBySession.set(sid, (waitlistBySession.get(sid) ?? 0) + 1);
      } else {
        confirmedBySession.set(sid, (confirmedBySession.get(sid) ?? 0) + 1);
      }
    }
  }

  return rows.map((r) => {
    const cls = Array.isArray(r.classes) ? r.classes[0] : r.classes;
    return {
      id: r.id as string,
      class_id: r.class_id as string,
      gym_id: r.gym_id as string,
      schedule_id: (r.schedule_id as string | null) ?? null,
      starts_at: r.starts_at as string,
      ends_at: r.ends_at as string,
      capacity: (r.capacity as number | null) ?? null,
      status: r.status as ClassSessionRow["status"],
      class_name: (cls as { name?: string } | null)?.name ?? "",
      confirmed_count: confirmedBySession.get(r.id as string) ?? 0,
      waitlist_count: waitlistBySession.get(r.id as string) ?? 0,
    };
  });
}

export async function loadSessionRoster(
  supabase: SupabaseClient,
  sessionId: string,
) {
  const { data: session, error: sErr } = await supabase
    .from("class_sessions")
    .select(
      `
      id,
      class_id,
      gym_id,
      schedule_id,
      starts_at,
      ends_at,
      capacity,
      status,
      classes ( name )
    `,
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !session) {
    console.error("loadSessionRoster session", sErr?.message);
    return null;
  }

  const { data: bookings, error: bErr } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      session_id,
      person_id,
      membership_id,
      status,
      waitlist_position,
      booked_at,
      persons ( full_name )
    `,
    )
    .eq("session_id", sessionId)
    .neq("status", "cancelled")
    .order("waitlist_position", { ascending: true, nullsFirst: false })
    .order("booked_at", { ascending: true });

  if (bErr) {
    console.error("loadSessionRoster bookings", bErr.message);
  }

  const cls = Array.isArray(session.classes)
    ? session.classes[0]
    : session.classes;

  return {
    session: {
      id: session.id as string,
      class_id: session.class_id as string,
      gym_id: session.gym_id as string,
      schedule_id: (session.schedule_id as string | null) ?? null,
      starts_at: session.starts_at as string,
      ends_at: session.ends_at as string,
      capacity: (session.capacity as number | null) ?? null,
      status: session.status as ClassSessionRow["status"],
      class_name: (cls as { name?: string } | null)?.name ?? "",
    },
    bookings: (bookings ?? []).map((b) => {
      const person = Array.isArray(b.persons) ? b.persons[0] : b.persons;
      return {
        id: b.id as string,
        session_id: b.session_id as string,
        person_id: b.person_id as string,
        membership_id: b.membership_id as string,
        status: b.status as import("@/lib/classes/types").ClassBookingStatus,
        waitlist_position: (b.waitlist_position as number | null) ?? null,
        booked_at: b.booked_at as string,
        person_name: (person as { full_name?: string } | null)?.full_name ?? "",
      };
    }),
  };
}

export async function loadSchedulesForClass(
  supabase: SupabaseClient,
  classId: string,
) {
  const { data, error } = await supabase
    .from("class_schedules")
    .select(
      "id, class_id, gym_id, recurrence, days_of_week, local_time, timezone, valid_from, valid_until, capacity, duration_minutes, is_active",
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadSchedulesForClass", error.message);
    return [];
  }

  return (data ?? []).map((s) => ({
    id: s.id as string,
    class_id: s.class_id as string,
    gym_id: s.gym_id as string,
    recurrence: s.recurrence as "none" | "weekly",
    days_of_week: (s.days_of_week as number[]) ?? [],
    local_time: String(s.local_time).slice(0, 5),
    timezone: s.timezone as string,
    valid_from: s.valid_from as string,
    valid_until: (s.valid_until as string | null) ?? null,
    capacity: (s.capacity as number | null) ?? null,
    duration_minutes: (s.duration_minutes as number | null) ?? null,
    is_active: Boolean(s.is_active),
  }));
}
