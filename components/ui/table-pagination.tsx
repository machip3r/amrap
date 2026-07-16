"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@/lib/pagination";

export type TablePaginationLabels = {
  showing: string;
  previous: string;
  next: string;
};

type Props = {
  meta: PageMeta;
  /** Path without query, e.g. `/en/members`. */
  href: string;
  /** Current query params to preserve (page will be overwritten). */
  searchParams?: Record<string, string | undefined>;
  labels: TablePaginationLabels;
};

function showingLabel(
  template: string,
  from: number,
  to: number,
  total: number,
) {
  return template
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(total));
}

function hrefForPage(
  base: string,
  searchParams: Record<string, string | undefined> | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (value != null && value !== "") params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function TablePagination({
  meta,
  href,
  searchParams,
  labels,
}: Props) {
  if (meta.total === 0) return null;

  const prevDisabled = meta.page <= 1;
  const nextDisabled = meta.page >= meta.totalPages;
  const prevHref = hrefForPage(href, searchParams, meta.page - 1);
  const nextHref = hrefForPage(href, searchParams, meta.page + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--color-muted)]">
        {showingLabel(labels.showing, meta.from, meta.to, meta.total)}
      </p>
      {meta.totalPages > 1 ? (
        <div className="flex items-center gap-2">
          {prevDisabled ? (
            <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-muted)] opacity-50">
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {labels.previous}
            </span>
          ) : (
            <Link
              href={prevHref}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
              prefetch={false}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {labels.previous}
            </Link>
          )}
          {nextDisabled ? (
            <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-muted)] opacity-50">
              {labels.next}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          ) : (
            <Link
              href={nextHref}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
              prefetch={false}
            >
              {labels.next}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
