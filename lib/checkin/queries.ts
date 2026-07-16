import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPageMeta,
  pageRange,
  TABLE_PAGE_SIZE,
  type PageMeta,
} from "@/lib/pagination";

export type CheckInListItem = {
  id: string;
  membershipId: string;
  personId: string;
  memberName: string;
  planName: string | null;
  checkedInAt: string;
  source: string;
};

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
  } = {},
): Promise<{ items: CheckInListItem[]; meta: PageMeta }> {
  const pageSize = opts.pageSize ?? TABLE_PAGE_SIZE;
  const page = opts.page ?? 1;
  const { from, to } = pageRange(page, pageSize);

  let query = supabase
    .from("check_ins")
    .select(CHECK_IN_LIST_SELECT, { count: "exact" })
    .eq("gym_id", gymId)
    .order("checked_in_at", { ascending: false })
    .range(from, to);

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
