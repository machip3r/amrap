import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "$lib/types";
import { memberStatusFromExpires } from "$lib/members/dates";
import { inviteStatusFromDb } from "$lib/validation/db-enums";
import {
  buildPageMeta,
  ilikeContains,
  pageRange,
  sanitizeSearchTerm,
  TABLE_PAGE_SIZE,
  type PageMeta,
} from "$lib/pagination";

type PlanEmbed =
  | { name: string }
  | { name: string }[]
  | null;

type MembershipPersonRow = {
  id: string;
  gym_id: string;
  branch_id: string | null;
  person_id: string;
  plan_id: string | null;
  status: string;
  invite_status: string | null;
  expires_at: string;
  created_at: string;
  plans: PlanEmbed;
  persons:
    | {
        full_name: string;
        phone: string | null;
        email: string | null;
        qr_code: string;
      }
    | {
        full_name: string;
        phone: string | null;
        email: string | null;
        qr_code: string;
      }[]
    | null;
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function personFromRow(row: MembershipPersonRow) {
  return firstEmbed(row.persons);
}

export function mapMembershipRow(row: MembershipPersonRow): Member | null {
  const person = personFromRow(row);
  if (!person) return null;
  const plan = firstEmbed(row.plans);
  return {
    id: row.id,
    gym_id: row.gym_id,
    branch_id: row.branch_id,
    person_id: row.person_id,
    name: person.full_name,
    phone: person.phone,
    email: person.email,
    status: memberStatusFromExpires(row.expires_at),
    invite_status: inviteStatusFromDb(row.invite_status),
    membership_expires_at: row.expires_at,
    qr_code: person.qr_code,
    created_at: row.created_at,
    plan_id: row.plan_id,
    plan_name: plan?.name ?? null,
  };
}

export const MEMBERSHIP_LIST_SELECT = `
  id,
  gym_id,
  branch_id,
  person_id,
  plan_id,
  status,
  invite_status,
  expires_at,
  created_at,
  plans ( name ),
  persons (
    full_name,
    phone,
    email,
    qr_code
  )
`;

const MEMBERSHIP_LIST_SELECT_INNER = `
  id,
  gym_id,
  branch_id,
  person_id,
  plan_id,
  status,
  invite_status,
  expires_at,
  created_at,
  plans ( name ),
  persons!inner (
    full_name,
    phone,
    email,
    qr_code
  )
`;

export type MembershipListFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: "all" | "ACTIVE" | "EXPIRED";
  planId?: string;
};

export async function listMembershipsPage(
  supabase: SupabaseClient,
  gymId: string,
  filters: MembershipListFilters = {},
): Promise<{ members: Member[]; meta: PageMeta }> {
  const pageSize = filters.pageSize ?? TABLE_PAGE_SIZE;
  const page = filters.page ?? 1;
  const { from, to } = pageRange(page, pageSize);
  const q = sanitizeSearchTerm(filters.q ?? "");
  const status = filters.status ?? "all";
  const planId =
    filters.planId && filters.planId !== "all" ? filters.planId : null;
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("memberships")
    .select(q ? MEMBERSHIP_LIST_SELECT_INNER : MEMBERSHIP_LIST_SELECT, {
      count: "exact",
    })
    .eq("gym_id", gymId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status === "ACTIVE") query = query.gt("expires_at", nowIso);
  if (status === "EXPIRED") query = query.lte("expires_at", nowIso);
  if (planId) query = query.eq("plan_id", planId);
  if (q) {
    const pattern = ilikeContains(q);
    query = query.or(
      `full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`,
      { foreignTable: "persons" },
    );
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("listMembershipsPage", error.message);
    return {
      members: [],
      meta: buildPageMeta(page, 0, pageSize),
    };
  }

  const members = (data ?? [])
    .map((r) => mapMembershipRow(r as MembershipPersonRow))
    .filter((m): m is Member => m != null);

  return {
    members,
    meta: buildPageMeta(page, count ?? 0, pageSize),
  };
}
