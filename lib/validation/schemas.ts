import { z } from "zod";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const localeSchema = z.string().refine(isLocale).transform((v) => v as Locale);

export const emailSchema = z.email().max(254);

export const nonEmptyString = (max = 200) =>
  z.string().trim().min(1).max(max);

export const optionalTrimmed = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length === 0 ? null : v));

export const uuidSchema = z.uuid();

export const paymentMethodSchema = z.enum(["cash", "transfer"]);

export const amountSchema = z.coerce.number().finite().min(0).max(1_000_000);

export const durationDaysSchema = z.coerce.number().int().min(1).max(3650);

export const passwordSchema = z.string().min(8).max(128);

export function formString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}
