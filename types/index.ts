export type Locale = "es" | "en";

export type Role = "OWNER" | "TRAINER" | "STAFF";

export type MemberStatus = "active" | "expired";

export type PaymentMethod = "cash" | "transfer";

export type Profile = {
  id: string;
  tenant_id: string;
  role: Role;
  full_name: string | null;
};

export type Tenant = {
  id: string;
  name: string;
};

export type Member = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  name: string;
  phone: string | null;
  status: MemberStatus;
  membership_expires_at: string;
  qr_code: string;
  created_at: string;
};

export type Plan = {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  duration_days: number;
};

export type Payment = {
  id: string;
  tenant_id: string;
  member_id: string;
  amount: number;
  method: PaymentMethod;
  created_at: string;
};
