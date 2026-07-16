"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Search, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { TeamMember } from "@/lib/team/queries";
import type { PageMeta } from "@/lib/pagination";
import { useListQueryParams } from "@/lib/list-query-params";
import { Input } from "@/components/ui/input";
import { LIMITS, sanitizeSearchInput } from "@/lib/validation/schemas";
import { removeTeamMemberAction } from "@/app/[locale]/(app)/team/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  TablePagination,
  type TablePaginationLabels,
} from "@/components/ui/table-pagination";

export type TeamListLabels = {
  name: string;
  email: string;
  joined: string;
  actions: string;
  remove: string;
  confirmRemove: string;
  noRows: string;
  noResults: string;
  searchPlaceholder: string;
  showing: string;
  reload: string;
  newBadge: string;
  view: string;
  previous: string;
  next: string;
  invitePending: string;
  inviteAccepted: string;
  inviteCancelled: string;
};

type Props = {
  locale: Locale;
  listRole: "trainer" | "staff";
  members: TeamMember[];
  labels: TeamListLabels;
  meta: PageMeta;
  q: string;
  highlightId?: string | null;
  /** Auth user id of the viewer — hide remove for yourself. */
  currentUserId: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function inviteBadgeClass(status: TeamMember["inviteStatus"]) {
  if (status === "pending") {
    return "bg-[var(--color-warning,var(--color-primary))]/15 text-[var(--color-warning,var(--color-primary))]";
  }
  if (status === "cancelled") {
    return "bg-[var(--color-muted)]/20 text-[var(--color-muted)]";
  }
  return "bg-[var(--color-success)]/15 text-[var(--color-success)]";
}

function inviteBadgeLabel(
  status: TeamMember["inviteStatus"],
  labels: TeamListLabels,
) {
  if (status === "pending") return labels.invitePending;
  if (status === "cancelled") return labels.inviteCancelled;
  return labels.inviteAccepted;
}

function formatJoined(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function TeamListClient({
  locale,
  listRole,
  members,
  labels,
  meta,
  q: initialQ,
  highlightId = null,
  currentUserId,
}: Props) {
  const router = useRouter();
  const d = getDictionary(locale);
  const { pending, pushParams, reload, pathname } = useListQueryParams();
  const [query, setQuery] = useState(initialQ);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (!highlightId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`team-row-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(scrollTimer);
  }, [highlightId]);

  const emptyMessage =
    meta.total === 0 && !initialQ ? labels.noRows : labels.noResults;

  const paginationLabels: TablePaginationLabels = {
    showing: labels.showing,
    previous: labels.previous,
    next: labels.next,
  };

  const searchParams = {
    q: initialQ || undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              aria-hidden
            />
            <Input
              type="search"
              variant="search"
              className="pl-10"
              maxLength={LIMITS.search}
              placeholder={labels.searchPlaceholder}
              value={query}
              onChange={(e) => {
                const value = sanitizeSearchInput(e.target.value);
                setQuery(value);
                pushParams(
                  searchParams,
                  { q: value.trim() || null },
                  { debounce: true },
                );
              }}
              aria-label={labels.searchPlaceholder}
            />
          </div>
          <button
            type="button"
            onClick={reload}
            disabled={pending}
            className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-60"
            aria-label={labels.reload}
            title={labels.reload}
          >
            <RefreshCw
              className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-4 py-3 sm:px-5">{labels.name}</th>
                <th className="px-4 py-3">{labels.email}</th>
                <th className="px-4 py-3">{labels.joined}</th>
                <th className="px-4 py-3 pr-5 text-right">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-[var(--color-muted)]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isNew = highlightId === m.id;
                  const href = `/${locale}/${listRole === "trainer" ? "trainers" : "staff"}/${m.id}`;
                  return (
                    <tr
                      key={m.id}
                      id={`team-row-${m.id}`}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                      className={`cursor-pointer border-b border-[var(--color-border)]/70 transition-colors last:border-b-0 hover:bg-[var(--color-surface-hover)]/40 ${
                        isNew ? "amrap-row-shine" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">
                            {initials(m.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--color-text)]">
                              {m.name}
                              {isNew ? (
                                <span className="ml-2 text-[11px] font-medium text-[var(--color-primary)]">
                                  {labels.newBadge}
                                </span>
                              ) : null}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${inviteBadgeClass(m.inviteStatus)}`}
                              >
                                {inviteBadgeLabel(m.inviteStatus, labels)}
                              </span>
                              {m.phone ? (
                                <p className="truncate text-xs text-[var(--color-muted)]">
                                  {m.phone}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--color-text)]">
                        {m.email ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[var(--color-text)]">
                        {formatJoined(m.createdAt, locale)}
                      </td>
                      <td
                        className="px-4 py-3.5 pr-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-3">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                            {labels.view}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          {m.userId === currentUserId ? null : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-danger)] transition-opacity hover:opacity-80"
                              onClick={() => setRemoving(m)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              {labels.remove}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          meta={meta}
          href={pathname}
          searchParams={searchParams}
          labels={paginationLabels}
        />
      </div>

      <ConfirmDialog
        open={removing != null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={labels.remove}
        description={
          removing
            ? `${labels.confirmRemove} (${removing.name})`
            : labels.confirmRemove
        }
        closeLabel={d.members.cancel}
        cancelLabel={d.members.cancel}
        confirmLabel={labels.remove}
        action={removeTeamMemberAction}
      >
        {removing ? (
          <>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="team_member_id" value={removing.id} />
            <input type="hidden" name="list_role" value={listRole} />
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
