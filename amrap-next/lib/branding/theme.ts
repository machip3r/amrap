import type { CSSProperties } from "react";
import type { BrandThemeTokens } from "@/types";

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_THEME_LIGHT = {
  primary: "#ff6b6b",
  primaryHover: "#fa5252",
  primarySoft: "#ffe4e4",
  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceHover: "#f1f5f9",
  ring: "#ff6b6b",
} as const;

export const DEFAULT_THEME_DARK = {
  primary: "#ff7171",
  primaryHover: "#ff8787",
  primarySoft: "rgba(255, 113, 113, 0.18)",
  bg: "#0b1120",
  surface: "#131b2f",
  surfaceHover: "#1e293b",
  ring: "#ff7171",
} as const;

export type ResolvedBrandTheme = {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryOn: string;
  bg: string;
  surface: string;
  surfaceHover: string;
  ring: string;
};

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] | null {
  if (!HEX_COLOR_PATTERN.test(hex)) return null;
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((c) => clampByte(c).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Slightly darker for hover. */
export function derivePrimaryHover(primary: string): string {
  const rgb = parseHex(primary);
  if (!rgb) return primary;
  return toHex(rgb[0] * 0.92, rgb[1] * 0.92, rgb[2] * 0.92);
}

export function derivePrimarySoft(primary: string, dark: boolean): string {
  const rgb = parseHex(primary);
  if (!rgb) return dark ? "rgba(255, 113, 113, 0.18)" : "#ffe4e4";
  if (dark) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.18)`;
  }
  return toHex(
    rgb[0] + (255 - rgb[0]) * 0.85,
    rgb[1] + (255 - rgb[1]) * 0.85,
    rgb[2] + (255 - rgb[2]) * 0.85,
  );
}

export function deriveSurfaceHover(surface: string, dark: boolean): string {
  const rgb = parseHex(surface);
  if (!rgb) return dark ? "#1e293b" : "#f1f5f9";
  if (dark) {
    return toHex(rgb[0] + 18, rgb[1] + 18, rgb[2] + 18);
  }
  return toHex(rgb[0] * 0.96, rgb[1] * 0.96, rgb[2] * 0.97);
}

/** Relative luminance 0–1 (sRGB). */
function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const lin = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

/** Text on primary buttons — dark on light primaries (e.g. charcoal dark). */
export function derivePrimaryOn(primary: string): string {
  return relativeLuminance(primary) > 0.45 ? "#0f172a" : "#ffffff";
}

function pickHex(
  tokens: BrandThemeTokens | null | undefined,
  key: keyof BrandThemeTokens,
  fallback: string,
): string {
  const value = tokens?.[key];
  if (typeof value === "string" && HEX_COLOR_PATTERN.test(value)) return value;
  return fallback;
}

export function resolveBrandTheme(
  tokens: BrandThemeTokens | null | undefined,
  mode: "light" | "dark",
): ResolvedBrandTheme {
  const defaults = mode === "light" ? DEFAULT_THEME_LIGHT : DEFAULT_THEME_DARK;
  const primary = pickHex(tokens, "primary", defaults.primary);
  const bg = pickHex(tokens, "bg", defaults.bg);
  const surface = pickHex(tokens, "surface", defaults.surface);
  const dark = mode === "dark";

  return {
    primary,
    primaryHover: derivePrimaryHover(primary),
    primarySoft: derivePrimarySoft(primary, dark),
    primaryOn: derivePrimaryOn(primary),
    bg,
    surface,
    surfaceHover: deriveSurfaceHover(surface, dark),
    ring: primary,
  };
}

/** Normalize jsonb from DB into a sparse BrandThemeTokens object. */
export function parseBrandThemeTokens(raw: unknown): BrandThemeTokens {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const out: BrandThemeTokens = {};
  for (const key of ["primary", "bg", "surface"] as const) {
    const v = obj[key];
    if (typeof v === "string" && HEX_COLOR_PATTERN.test(v)) {
      out[key] = v.toLowerCase();
    }
  }
  return out;
}

export function brandThemeCssVars(
  light: BrandThemeTokens | null | undefined,
  dark: BrandThemeTokens | null | undefined,
): { light: Record<string, string>; dark: Record<string, string> } {
  const L = resolveBrandTheme(light, "light");
  const D = resolveBrandTheme(dark, "dark");

  const map = (t: ResolvedBrandTheme) => ({
    "--color-primary": t.primary,
    "--color-primary-hover": t.primaryHover,
    "--color-primary-soft": t.primarySoft,
    "--color-primary-on": t.primaryOn,
    "--color-bg": t.bg,
    "--color-surface": t.surface,
    "--color-surface-hover": t.surfaceHover,
    "--color-ring": t.ring,
  });

  return { light: map(L), dark: map(D) };
}

export function cssVarsToInlineStyle(
  vars: Record<string, string>,
): CSSProperties {
  return vars as CSSProperties;
}
