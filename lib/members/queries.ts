import type { Member } from "@/types";
import { memberStatusFromExpires } from "@/lib/members/dates";

type MembershipPersonRow = {
  id: string;
  gym_id: string;
  branch_id: string | null;
  person_id: string;
  status: string;
  expires_at: string;
  created_at: string;
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

function personFromRow(row: MembershipPersonRow) {
  const p = row.persons;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export function mapMembershipRow(row: MembershipPersonRow): Member | null {
  const person = personFromRow(row);
  if (!person) return null;
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
  };
}

export const MEMBERSHIP_LIST_SELECT = `
  id,
  gym_id,
  branch_id,
  person_id,
  status,
  expires_at,
  created_at,
  persons (
    full_name,
    phone,
    email,
    qr_code
  )
`;
