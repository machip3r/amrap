/** Default page size for admin list tables (Supabase `.range`). */
export const TABLE_PAGE_SIZE = 25;

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
};

export function parsePage(raw: string | string[] | undefined | null): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function pageRange(page: number, pageSize = TABLE_PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  return { from, to: from + pageSize - 1, pageSize };
}

export function buildPageMeta(
  page: number,
  total: number,
  pageSize = TABLE_PAGE_SIZE,
): PageMeta {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(safePage * pageSize, total);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    from,
    to,
  };
}

/** Strip PostgREST `or` / `ilike` metacharacters from user search input. */
export function sanitizeSearchTerm(raw: string, maxLen = 64): string {
  return raw
    .trim()
    .replace(/[%_,.()"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, maxLen);
}

export function ilikeContains(term: string): string {
  return `%${term}%`;
}
