import { z } from "zod";
import { isLocale, type Locale } from "$lib/i18n/config";
import {
  DEFAULT_PHONE_COUNTRY,
  countryByIso2,
  formatInternationalPhone,
  nationalDigits,
  parseInternationalPhone,
} from "$lib/phone/countries";

/** National mobile length shown in the phone field (digits only). */
export const LIMITS = {
  email: 254,
  password: { min: 8, max: 128 },
  personName: 120,
  entityName: 120,
  phone: 10,
  /** E.164 with +: max country code + national (ITU ≤15 digits after +). */
  phoneE164: 16,
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

/** Exactly 10 digits (national number in the UI field). No spaces, +, or punctuation. */
export const PHONE_PATTERN = /^\d{10}$/;

/** Stored phone: `+` plus 7–15 digits (E.164). National part is validated separately. */
export const E164_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

/** Strip non-digits for the national input; normalize pasted +52 / +1 to 10 digits. */
export function sanitizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, LIMITS.phone);
}

/**
 * Normalize a form/DB phone to `+{dial}{10 national}` or null if empty.
 * Bare 10-digit values default to MX (+52).
 */
export function normalizeStoredPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length === LIMITS.phone && !trimmed.includes("+")) {
    const dial =
      countryByIso2(DEFAULT_PHONE_COUNTRY)?.dial ?? "52";
    return formatInternationalPhone(dial, digitsOnly);
  }

  const parsed = parseInternationalPhone(trimmed);
  const national = nationalDigits(parsed.national).slice(0, LIMITS.phone);
  if (national.length !== LIMITS.phone) return null;
  return formatInternationalPhone(parsed.dial, national);
}

export function isValidStoredPhone(raw: string): boolean {
  const normalized = normalizeStoredPhone(raw);
  return Boolean(normalized && E164_PHONE_PATTERN.test(normalized));
}

/** Lowercase + printable ASCII only, capped — client `onChange` for email. */
export function sanitizeEmailInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\x20-\x7E]/g, "")
    .slice(0, LIMITS.email);
}

/** Letters / accents / safe punctuation only — client `onChange` for person names. */
export function sanitizePersonNameInput(raw: string): string {
  return raw.replace(/[^\p{L}\p{M}\s'.-]/gu, "").slice(0, LIMITS.personName);
}

/** Entity labels — no angle brackets or controls. */
export function sanitizeEntityNameInput(raw: string): string {
  return raw
    .replace(/[<>\x00-\x1F\x7F]/g, "")
    .slice(0, LIMITS.entityName);
}

/** Printable ASCII only — strips control characters from password fields. */
export function sanitizePasswordInput(raw: string): string {
  return raw.replace(/[^\x20-\x7E]/g, "").slice(0, LIMITS.password.max);
}

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
  .transform((v) => sanitizeEmailInput(v.trim()))
  .pipe(z.string().min(3).max(LIMITS.email).regex(EMAIL_PATTERN));

export const passwordSchema = z
  .string()
  .transform((v) => sanitizePasswordInput(v))
  .pipe(
    z
      .string()
      .min(LIMITS.password.min)
      .max(LIMITS.password.max)
      .regex(PASSWORD_PATTERN),
  );

/** Login only: length-bounded, no control chars (do not enforce min strength on login). */
export const loginPasswordSchema = z
  .string()
  .transform((v) => sanitizePasswordInput(v))
  .pipe(
    z
      .string()
      .min(1)
      .max(LIMITS.password.max)
      .regex(PASSWORD_PATTERN),
  );

export const personNameSchema = z
  .string()
  .transform((v) => sanitizePersonNameInput(v).trim())
  .pipe(
    z
      .string()
      .min(1)
      .max(LIMITS.personName)
      .regex(PERSON_NAME_PATTERN),
  );

export const entityNameSchema = z
  .string()
  .transform((v) => sanitizeEntityNameInput(v).trim())
  .pipe(
    z
      .string()
      .min(1)
      .max(LIMITS.entityName)
      .regex(ENTITY_NAME_PATTERN),
  );

export const optionalEntityNameSchema = z
  .string()
  .transform((v) => sanitizeEntityNameInput(v).trim())
  .pipe(
    z
      .string()
      .max(LIMITS.entityName)
      .refine((v) => v.length === 0 || ENTITY_NAME_PATTERN.test(v), {
        message: "entity_name",
      })
      .transform((v) => (v.length === 0 ? null : v)),
  );

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
  .transform((v, ctx) => {
    const normalized = normalizeStoredPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return normalized;
  });

export const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const normalized = normalizeStoredPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return normalized;
  });

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

/** Date of birth — valid calendar day, age 18–120 (legal majority). */
export const MIN_PROFILE_AGE_YEARS = 18;
export const MAX_PROFILE_AGE_YEARS = 120;

/** Latest ISO date (YYYY-MM-DD) that still satisfies `minAge` years old today. */
export function maxDateOfBirthIso(
  minAge: number = MIN_PROFILE_AGE_YEARS,
  now: Date = new Date(),
): string {
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear() - minAge,
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );
  return d.toISOString().slice(0, 10);
}

/** Earliest ISO date for `maxAge` years old. */
export function minDateOfBirthIso(
  maxAge: number = MAX_PROFILE_AGE_YEARS,
  now: Date = new Date(),
): string {
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear() - maxAge,
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );
  return d.toISOString().slice(0, 10);
}

export const dateOfBirthSchema = isoDateSchema
  .refine((v) => v <= maxDateOfBirthIso(MIN_PROFILE_AGE_YEARS), {
    message: "date_min_age",
  })
  .refine((v) => v >= minDateOfBirthIso(MAX_PROFILE_AGE_YEARS), {
    message: "date",
  });

export const SEX_VALUES = ["male", "female", "other", "prefer_not"] as const;
export type SexValue = (typeof SEX_VALUES)[number];

export const sexSchema = z.enum(SEX_VALUES);

export const heightCmSchema = z.coerce
  .number()
  .finite()
  .min(50)
  .max(250);

export const weightKgSchema = z.coerce
  .number()
  .finite()
  .min(20)
  .max(400);

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

/** Search box — strip disallowed chars and cap length. */
export function sanitizeSearchInput(raw: string): string {
  return raw.replace(/[^\p{L}\p{M}\p{N}\s.@+\-_]/gu, "").slice(0, LIMITS.search);
}

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
