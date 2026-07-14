"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Search, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { TeamMember } from "@/lib/team/queries";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/validation/schemas";
import { removeTeamMemberAction } from "@/app/[locale]/(app)/team/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
};

type Props = {
  locale: Locale;
  listRole: "trainer" | "staff";
  members: TeamMember[];
  labels: TeamListLabels;
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

export function TeamListClient({
  locale,
  listRole,
  members,
  labels,
  highlightId = null,
  currentUserId,
}: Props) {
  const router = useRouter();
  const d = getDictionary(locale);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`team-row-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(scrollTimer);
  }, [highlightId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = [m.name, m.email ?? "", m.phone ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [members, query]);

  const emptyMessage =
    members.length === 0 ? labels.noRows : labels.noResults;

  function reload() {
    startTransition(() => {
      router.refresh();
    });
  }

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
              onChange={(e) => setQuery(e.target.value)}
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
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-[var(--color-muted)]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
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
                            {m.phone ? (
                              <p className="truncate text-xs text-[var(--color-muted)]">
                                {m.phone}
                              </p>
                            ) : null}
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

        {filtered.length > 0 ? (
          <div className="border-t border-[var(--color-border)] px-5 py-3 text-sm text-[var(--color-muted)]">
            {showingLabel(labels.showing, 1, filtered.length, filtered.length)}
          </div>
        ) : null}
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
