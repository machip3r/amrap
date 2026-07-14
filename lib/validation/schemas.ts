import { z } from "zod";
import { isLocale, type Locale } from "@/lib/i18n/config";

/** Shared limits — keep form `maxLength` in sync with these. */
export const LIMITS = {
  email: 254,
  password: { min: 8, max: 128 },
  personName: 120,
  entityName: 120,
  phone: 40,
  otp: { min: 6, max: 6 },
  message: 2000,
  search: 100,
  checkInCode: 200,
  address: 240,
} as const;

/** Lowercase email local+domain shape (after trim + lowercasing). */
export const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Letters (incl. accents), spaces, apostrophe, hyphen, period. */
export const PERSON_NAME_PATTERN = /^[\p{L}\p{M}](?:[\p{L}\p{M}\s'.-]*[\p{L}\p{M}.])?$/u;

/** Org / gym / plan / branch labels — no angle brackets or control chars. */
export const ENTITY_NAME_PATTERN =
  /^(?!.*[<>])[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N}\s.&'+_/\-()]*[\p{L}\p{M}\p{N}.])?$/u;

/** Optional leading +, digits, spaces, dashes, dots, parentheses. */
export const PHONE_PATTERN = /^\+?[\d\s().-]{7,40}$/;

/** Printable password chars only (no control characters). */
export const PASSWORD_PATTERN = /^[\x20-\x7E]+$/;

/** Signup / email OTP tokens (6 digits). */
export const OTP_PATTERN = /^\d{6}$/;

/** HTML date input value. */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `date` or `datetime-local` values. */
export const DATETIME_LOCAL_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?$/;

/** Free text (contact message) — allow newlines/tabs, reject other controls. */
export const MESSAGE_PATTERN = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+$/;

export const localeSchema = z
  .string()
  .refine(isLocale)
  .transform((v) => v as Locale);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(LIMITS.email)
  .regex(EMAIL_PATTERN);

export const passwordSchema = z
  .string()
  .min(LIMITS.password.min)
  .max(LIMITS.password.max)
  .regex(PASSWORD_PATTERN);

/** Login only: length-bounded, no control chars (do not enforce min strength on login). */
export const loginPasswordSchema = z
  .string()
  .min(1)
  .max(LIMITS.password.max)
  .regex(PASSWORD_PATTERN);

export const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.personName)
  .regex(PERSON_NAME_PATTERN);

export const entityNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.entityName)
  .regex(ENTITY_NAME_PATTERN);

export const optionalEntityNameSchema = z
  .string()
  .trim()
  .max(LIMITS.entityName)
  .refine((v) => v.length === 0 || ENTITY_NAME_PATTERN.test(v), {
    message: "entity_name",
  })
  .transform((v) => (v.length === 0 ? null : v));

/** Street / venue address — optional, no control chars or angle brackets. */
export const optionalAddressSchema = z
  .string()
  .trim()
  .max(LIMITS.address)
  .refine((v) => v.length === 0 || /^[^\x00-\x1F\x7F<>]+$/.test(v), {
    message: "invalid",
  })
  .transform((v) => (v.length === 0 ? null : v));

export const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(LIMITS.phone)
  .regex(PHONE_PATTERN);

export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(LIMITS.phone)
  .refine((v) => v.length === 0 || PHONE_PATTERN.test(v), {
    message: "phone",
  })
  .transform((v) => (v.length === 0 ? null : v));

export const otpSchema = z
  .string()
  .trim()
  .length(LIMITS.otp.min)
  .regex(OTP_PATTERN);

export const isoDateSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_PATTERN)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, { message: "invalid_date" });

export const membershipExpiresSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(DATETIME_LOCAL_PATTERN)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: "invalid_date",
  });

export const messageSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.message)
  .regex(MESSAGE_PATTERN);

export const searchQuerySchema = z
  .string()
  .trim()
  .max(LIMITS.search)
  .regex(/^[\p{L}\p{M}\p{N}\s.@+\-_]*$/u);

/** QR payload or membership UUID typed at the desk. */
export const checkInCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.checkInCode)
  .regex(/^[^\x00-\x1F\x7F]+$/);

/** @deprecated Prefer personNameSchema / entityNameSchema for typed fields. */
export const nonEmptyString = (max = 200) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(/^[^\x00-\x1F\x7F<>]+$/);

/** @deprecated Prefer optionalPhoneSchema / optionalEntityNameSchema. */
export const optionalTrimmed = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^\x00-\x1F\x7F<>]*$/)
    .transform((v) => (v.length === 0 ? null : v));

export const uuidSchema = z.uuid();

export const paymentMethodSchema = z.enum(["cash", "transfer"]);

export const amountSchema = z.coerce.number().finite().min(0).max(1_000_000);

export const durationDaysSchema = z.coerce.number().int().min(1).max(3650);

/** HTML hex color (#RRGGBB). */
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const hexColorSchema = z
  .string()
  .trim()
  .regex(HEX_COLOR_PATTERN)
  .transform((v) => v.toLowerCase());

/** Optional hex — empty string becomes undefined (use default). */
export const optionalHexColorSchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.union([hexColorSchema, z.undefined()]));

export function formString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}
