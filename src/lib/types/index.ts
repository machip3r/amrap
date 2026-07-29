export type Locale = "es" | "en";

/** Contextual gym role (a user may hold different roles at different gyms). */
export type Role = "OWNER" | "TRAINER" | "STAFF";

export type OrgPlanTier = "FREEMIUM" | "STARTER" | "GROWTH" | "PRO";

/** Derived from memberships.expires_at for UI; DB status uses ACTIVE/EXPIRED etc. */
export type MemberStatus = "ACTIVE" | "EXPIRED";

export type PaymentMethod = "CASH" | "TRANSFER" | "ONLINE";

/** Connected PSP for gym → member charges (not AMRAP org billing). */
export type PaymentProvider = "MERCADOPAGO" | "STRIPE" | "CLIP";

export type PaymentAccountStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";

export type PaymentCheckoutStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type CheckInSource = "QR" | "MANUAL" | "KIOSK";

/** Global auth-linked or staff-created identity (QR lives here). */
export type Person = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  qr_code: string;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  plan_tier: OrgPlanTier;
  created_at: string;
};

export type BrandThemeTokens = {
  primary?: string;
  bg?: string;
  surface?: string;
};

/** Per-user ops chrome prefs: which nav destinations this user hides. */
export type NavVisibility = {
  hidden: string[];
};

export type Gym = {
  id: string;
  organization_id: string;
  name: string;
  owner_user_id: string | null;
  logo_url_light: string | null;
  logo_url_dark: string | null;
  theme_light: BrandThemeTokens;
  theme_dark: BrandThemeTokens;
  created_at: string;
};

export type Branch = {
  id: string;
  gym_id: string;
  name: string;
};

export type GymRole = {
  id: string;
  gym_id: string;
  user_id: string;
  role: Role;
  is_provisional_owner: boolean;
  permissions: Record<string, boolean>;
  nav_visibility: NavVisibility;
};

/**
 * Active workspace for app routes: one gym context at a time.
 * Replaces the old single-tenant Profile.
 */
export type Workspace = {
  userId: string;
  personId: string;
  fullName: string | null;
  /** Person QR token for ops mobile nav; null when not linked. */
  qrCode: string | null;
  organizationId: string;
  organizationName: string;
  planTier: OrgPlanTier;
  gymId: string;
  gymName: string;
  logoUrlLight: string | null;
  logoUrlDark: string | null;
  themeLight: BrandThemeTokens;
  themeDark: BrandThemeTokens;
  /** Ops nav item ids this user hid for the active gym (after role checks). */
  hiddenNavIds: string[];
  role: Role;
  isProvisionalOwner: boolean;
  /** Effective owner powers (real owner or provisional). */
  canActAsOwner: boolean;
};

/** @deprecated Prefer Workspace — kept for gradual migration naming. */
export type Profile = Workspace & {
  id: string;
  tenant_id: string;
  full_name: string | null;
};

export type Membership = {
  id: string;
  gym_id: string;
  branch_id: string | null;
  person_id: string;
  plan_id: string | null;
  status: string;
  expires_at: string;
  created_at: string;
};

export type InviteStatus = "PENDING" | "ACCEPTED" | "CANCELLED";

/** Membership joined with person fields for UI lists. */
export type Member = {
  id: string;
  gym_id: string;
  branch_id: string | null;
  person_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: MemberStatus;
  invite_status: InviteStatus;
  membership_expires_at: string;
  qr_code: string;
  created_at: string;
  plan_id: string | null;
  plan_name: string | null;
};

export type Plan = {
  id: string;
  gym_id: string;
  branch_id: string | null;
  name: string;
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at?: string;
};

export type PaymentKind = "PLAN" | "DAY_PASS";

/** Desk pricing mode when recording a payment (forms / Zod). */
export type PaymentPricingMode = "FULL" | "DISCOUNT" | "TRIAL";

export type Payment = {
  id: string;
  gym_id: string;
  membership_id: string;
  /** Charged amount (0 = trial / courtesy). */
  amount: number;
  /** Catalog price at record time; null on legacy rows. */
  list_amount: number | null;
  method: PaymentMethod;
  kind: PaymentKind;
  plan_id: string | null;
  provider?: PaymentProvider | null;
  provider_payment_id?: string | null;
  checkout_id?: string | null;
  created_at: string;
};

export type GymClass = {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
};
