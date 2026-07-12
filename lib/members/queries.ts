import type { Member } from "@/types";
import { memberStatusFromExpires } from "@/lib/members/dates";

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
