import type { BrandThemeTokens } from "$lib/types";
import { DEFAULT_THEME_DARK, DEFAULT_THEME_LIGHT } from "$lib/branding/theme";

export type BrandPaletteTemplateId = "amrap" | "ocean" | "charcoal";

export type BrandPaletteTemplate = {
  id: BrandPaletteTemplateId;
  /** i18n key under settings.palette* */
  nameKey: "paletteAmrap" | "paletteOcean" | "paletteCharcoal";
  light: BrandThemeTokens;
  dark: BrandThemeTokens;
};

/** Preset light+dark palettes owners can apply in one click. */
export const BRAND_PALETTE_TEMPLATES: BrandPaletteTemplate[] = [
  {
    id: "amrap",
    nameKey: "paletteAmrap",
    light: {
      primary: DEFAULT_THEME_LIGHT.primary,
      bg: DEFAULT_THEME_LIGHT.bg,
      surface: DEFAULT_THEME_LIGHT.surface,
    },
    dark: {
      primary: DEFAULT_THEME_DARK.primary,
      bg: DEFAULT_THEME_DARK.bg,
      surface: DEFAULT_THEME_DARK.surface,
    },
  },
  {
    id: "ocean",
    nameKey: "paletteOcean",
    light: {
      primary: "#2563eb",
      bg: "#f9fafb",
      surface: "#ffffff",
    },
    dark: {
      primary: "#3b82f6",
      bg: "#0f172a",
      surface: "#1e293b",
    },
  },
  {
    id: "charcoal",
    nameKey: "paletteCharcoal",
    light: {
      primary: "#111827",
      bg: "#f3f4f6",
      surface: "#ffffff",
    },
    dark: {
      primary: "#e5e7eb",
      bg: "#030712",
      surface: "#111827",
    },
  },
];

export function getPaletteTemplate(
  id: string,
): BrandPaletteTemplate | undefined {
  return BRAND_PALETTE_TEMPLATES.find((t) => t.id === id);
}
