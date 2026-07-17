import { getSupabaseUrl } from "$lib/supabase/env";

export const GYM_LOGOS_BUCKET = "gym-logos";

/**
 * Normalize a DB logo value to a storage object path (no bucket, no query).
 * Accepts legacy full public URLs and returns the relative path.
 */
export function normalizeGymLogoPath(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const marker = `/storage/v1/object/public/${GYM_LOGOS_BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(url.pathname.slice(idx + marker.length));
      }
      return null;
    }
  } catch {
    return null;
  }

  // Already a relative path (optionally with leading slash / query)
  return trimmed.replace(/^\/+/, "").split("?")[0] || null;
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/** Public URL for an img src from a stored relative path (or legacy full URL). */
export function gymLogoPublicUrl(
  value: string | null | undefined,
  cacheKey?: string | number | null,
): string | null {
  const path = normalizeGymLogoPath(value);
  if (!path) return null;
  const base = getSupabaseUrl().replace(/\/+$/, "");
  const url = `${base}/storage/v1/object/public/${GYM_LOGOS_BUCKET}/${encodeStoragePath(path)}`;
  if (cacheKey == null || cacheKey === "") return url;
  return `${url}?v=${encodeURIComponent(String(cacheKey))}`;
}
