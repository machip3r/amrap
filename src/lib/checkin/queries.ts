import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPageMeta,
  pageRange,
  TABLE_PAGE_SIZE,
  type PageMeta,
} from "$lib/pagination";

export type CheckInListItem = {
  id: string;
  membershipId: string;
  personId: string;
  memberName: string;
  planName: string | null;
  checkedInAt: string;
  source: string;
};

/** Filter history by gym role of the checked-in person. */
export type CheckInPersonType = "member" | "trainer" | "staff";

export const CHECK_IN_PERSON_TYPES: readonly CheckInPersonType[] = [
  "member",
  "trainer",
  "staff",
] as const;

export function parseCheckInPersonType(
  raw: string | null | undefined,
): CheckInPersonType | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "member" || v === "trainer" || v === "staff") return v;
  return null;
}

type PersonEmbed = { full_name: string } | { full_name: string }[] | null;
type PlanEmbed = { name: string } | { name: string }[] | null;
type MembershipEmbed =
  | { id: string; plans: PlanEmbed }
  | { id: string; plans: PlanEmbed }[]
  | null;

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const CHECK_IN_LIST_SELECT = `
  id,
  membership_id,
  person_id,
  checked_in_at,
  source,
  persons ( full_name ),
  memberships (
    id,
    plans ( name )
  )
`;

function mapCheckInRow(row: {
  id: string;
  membership_id: string;
  person_id: string;
  checked_in_at: string;
  source: string;
  persons: PersonEmbed;
  memberships: MembershipEmbed;
}): CheckInListItem | null {
  const person = firstEmbed(row.persons);
  const membership = firstEmbed(row.memberships);
  const plan = firstEmbed(membership?.plans ?? null);
  if (!person?.full_name) return null;
  return {
    id: row.id,
    membershipId: row.membership_id || membership?.id || "",
    personId: row.person_id,
    memberName: person.full_name,
    planName: plan?.name ?? null,
    checkedInAt: row.checked_in_at,
    source: row.source,
  };
}

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Person IDs at this gym by ops role (via `gym_roles.user_id` → `persons.user_id`).
 * Staff includes OWNER (reception / management).
 */
async function personIdsForOpsRoles(
  supabase: SupabaseClient,
  gymId: string,
  roles: Array<"TRAINER" | "STAFF" | "OWNER">,
): Promise<string[]> {
  const { data: roleRows, error: roleErr } = await supabase
    .from("gym_roles")
    .select("user_id")
    .eq("gym_id", gymId)
    .in("role", roles);

  if (roleErr) {
    console.error("personIdsForOpsRoles roles", roleErr.message);
    return [];
  }

  const userIds = [
    ...new Set(
      (roleRows ?? [])
        .map((r) => r.user_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (userIds.length === 0) return [];

  const { data: people, error: peopleErr } = await supabase
    .from("persons")
    .select("id")
    .in("user_id", userIds);

  if (peopleErr) {
    console.error("personIdsForOpsRoles persons", peopleErr.message);
    return [];
  }

  return (people ?? []).map((p) => p.id as string).filter(Boolean);
}

async function personIdsForCheckInType(
  supabase: SupabaseClient,
  gymId: string,
  personType: CheckInPersonType,
): Promise<{ mode: "in" | "not_in"; ids: string[] } | { mode: "empty" }> {
  if (personType === "trainer") {
    const ids = await personIdsForOpsRoles(supabase, gymId, ["TRAINER"]);
    return ids.length === 0 ? { mode: "empty" } : { mode: "in", ids };
  }
  if (personType === "staff") {
    const ids = await personIdsForOpsRoles(supabase, gymId, ["STAFF", "OWNER"]);
    return ids.length === 0 ? { mode: "empty" } : { mode: "in", ids };
  }
  // Members: check-ins whose person is not trainer/staff/owner at this gym
  const opsIds = await personIdsForOpsRoles(supabase, gymId, [
    "TRAINER",
    "STAFF",
    "OWNER",
  ]);
  return { mode: "not_in", ids: opsIds };
}

export async function listTodayCheckIns(
  supabase: SupabaseClient,
  gymId: string,
  limit = 40,
): Promise<CheckInListItem[]> {
  const todayStart = startOfLocalDay().toISOString();
  const { data, error } = await supabase
    .from("check_ins")
    .select(CHECK_IN_LIST_SELECT)
    .eq("gym_id", gymId)
    .gte("checked_in_at", todayStart)
    .order("checked_in_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listTodayCheckIns", error.message);
    return [];
  }

  return (data ?? [])
    .map((r) => mapCheckInRow(r as Parameters<typeof mapCheckInRow>[0]))
    .filter((r): r is CheckInListItem => r != null);
}

export async function listCheckInsPage(
  supabase: SupabaseClient,
  gymId: string,
  opts: {
    page?: number;
    pageSize?: number;
    /** Inclusive local calendar day YYYY-MM-DD */
    date?: string | null;
    /** Optional filter by ops role of the checked-in person */
    personType?: CheckInPersonType | null;
  } = {},
): Promise<{ items: CheckInListItem[]; meta: PageMeta }> {
  const pageSize = opts.pageSize ?? TABLE_PAGE_SIZE;
  const page = opts.page ?? 1;
  const { from, to } = pageRange(page, pageSize);

  let personFilter: { mode: "in" | "not_in"; ids: string[] } | null = null;
  if (opts.personType) {
    const filter = await personIdsForCheckInType(
      supabase,
      gymId,
      opts.personType,
    );
    if (filter.mode === "empty") {
      return { items: [], meta: buildPageMeta(page, 0, pageSize) };
    }
    personFilter = filter;
  }

  let query = supabase
    .from("check_ins")
    .select(CHECK_IN_LIST_SELECT, { count: "exact" })
    .eq("gym_id", gymId)
    .order("checked_in_at", { ascending: false })
    .range(from, to);

  if (personFilter?.mode === "in") {
    query = query.in("person_id", personFilter.ids);
  } else if (personFilter?.mode === "not_in" && personFilter.ids.length > 0) {
    query = query.not("person_id", "in", `(${personFilter.ids.join(",")})`);
  }

  if (opts.date) {
    const start = new Date(`${opts.date}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query = query
        .gte("checked_in_at", start.toISOString())
        .lt("checked_in_at", end.toISOString());
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("listCheckInsPage", error.message);
    return { items: [], meta: buildPageMeta(page, 0, pageSize) };
  }

  const items = (data ?? [])
    .map((r) => mapCheckInRow(r as Parameters<typeof mapCheckInRow>[0]))
    .filter((r): r is CheckInListItem => r != null);

  return {
    items,
    meta: buildPageMeta(page, count ?? 0, pageSize),
  };
}

export type MemberMonthCheckIn = {
  id: string;
  checkedInAt: string;
  source: string;
};

export type MemberCheckInMonth = {
  membershipId: string;
  memberName: string;
  email: string | null;
  phone: string | null;
  planName: string | null;
  expiresAt: string | null;
  year: number;
  month: number; // 1-12
  checkIns: MemberMonthCheckIn[];
};

export async function loadMemberCheckInsMonth(
  supabase: SupabaseClient,
  gymId: string,
  membershipId: string,
  year: number,
  month: number,
): Promise<MemberCheckInMonth | null> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const { data: membership, error: memErr } = await supabase
    .from("memberships")
    .select(
      `
      id,
      expires_at,
      plans ( name ),
      persons ( full_name, email, phone )
    `,
    )
    .eq("id", membershipId)
    .eq("gym_id", gymId)
    .maybeSingle();

  if (memErr || !membership) {
    if (memErr) console.error("loadMemberCheckInsMonth membership", memErr.message);
    return null;
  }

  const person = firstEmbed(
    membership.persons as
      | { full_name: string; email: string | null; phone: string | null }
      | { full_name: string; email: string | null; phone: string | null }[]
      | null,
  );
  const plan = firstEmbed(membership.plans as PlanEmbed);
  if (!person?.full_name) return null;

  const { data: rows, error } = await supabase
    .from("check_ins")
    .select("id, checked_in_at, source")
    .eq("gym_id", gymId)
    .eq("membership_id", membershipId)
    .gte("checked_in_at", monthStart.toISOString())
    .lt("checked_in_at", monthEnd.toISOString())
    .order("checked_in_at", { ascending: true });

  if (error) {
    console.error("loadMemberCheckInsMonth", error.message);
    return null;
  }

  return {
    membershipId,
    memberName: person.full_name,
    email: person.email ?? null,
    phone: person.phone ?? null,
    planName: plan?.name ?? null,
    expiresAt: (membership.expires_at as string | null) ?? null,
    year,
    month,
    checkIns: (rows ?? []).map((r) => ({
      id: r.id as string,
      checkedInAt: r.checked_in_at as string,
      source: r.source as string,
    })),
  };
}
