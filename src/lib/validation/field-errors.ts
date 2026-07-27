import type { ZodError, ZodIssue } from "zod";

/** Shared validation copy (app + landing). */
export type ValidationMessages = {
  required: string;
  email: string;
  password: string;
  passwordMin: string;
  passwordMismatch: string;
  personName: string;
  entityName: string;
  phone: string;
  otp: string;
  message: string;
  amount: string;
  duration: string;
  date: string;
  dateMinAge: string;
  invalid: string;
  hexColor: string;
  time: string;
  scheduleDays: string;
  scheduleOrder: string;
};

const FIELD_KIND: Record<string, keyof ValidationMessages> = {
  email: "email",
  password: "password",
  confirmPassword: "password",
  organizationName: "entityName",
  fullName: "personName",
  gymName: "entityName",
  branchName: "entityName",
  gymAddress: "invalid",
  name: "personName",
  phone: "phone",
  otp: "otp",
  message: "message",
  amount: "amount",
  price: "amount",
  duration_days: "duration",
  membership_expires_at: "date",
  date_of_birth: "date",
  gender: "required",
  height_cm: "amount",
  weight_kg: "amount",
  plan_id: "required",
  member_id: "invalid",
  method: "required",
  roleIntent: "required",
  lightPrimary: "hexColor",
  lightBg: "hexColor",
  lightSurface: "hexColor",
  darkPrimary: "hexColor",
  darkBg: "hexColor",
  darkSurface: "hexColor",
  schedule_days: "scheduleDays",
  schedule_open_time: "time",
  schedule_close_time: "time",
};

/** Plan / member create both use `name` — pass overrides when needed. */
export function zodFieldErrors(
  error: ZodError,
  messages: ValidationMessages,
  fieldKindOverrides?: Partial<Record<string, keyof ValidationMessages>>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!key || out[key]) continue;
    out[key] = messageForIssue(key, issue, messages, fieldKindOverrides);
  }
  return out;
}

function messageForIssue(
  field: string,
  issue: ZodIssue,
  messages: ValidationMessages,
  overrides?: Partial<Record<string, keyof ValidationMessages>>,
): string {
  if (issue.message === "mismatch") return messages.passwordMismatch;
  if (issue.message === "date_min_age") return messages.dateMinAge;
  if (issue.message === "schedule_order") return messages.scheduleOrder;
  if (issue.message === "weekday") return messages.scheduleDays;

  if (issue.code === "too_small" && issue.origin === "string") {
    if (issue.minimum === 1) return messages.required;
    if (field === "password" || field === "confirmPassword") {
      return messages.passwordMin;
    }
  }

  const kind = overrides?.[field] ?? FIELD_KIND[field] ?? "invalid";
  return messages[kind];
}
