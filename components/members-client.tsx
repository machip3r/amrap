"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Member } from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LIMITS } from "@/lib/validation/schemas";

export type MembersPageLabels = {
  name: string;
  email: string;
  plan: string;
  noPlan: string;
  status: string;
  expires: string;
  active: string;
  expired: string;
  actions: string;
  view: string;
  noMembers: string;
  noResults: string;
  searchPlaceholder: string;
  filterAll: string;
  filterActive: string;
  filterExpired: string;
  filterPlan: string;
  filterPlanAll: string;
  showing: string;
  reload: string;
  newBadge: string;
};

type PlanFilterOption = {
  id: string;
  name: string;
};

type StatusFilter = "all" | "active" | "expired";

type Props = {
  locale: Locale;
  members: Member[];
  plans: PlanFilterOption[];
  labels: MembersPageLabels;
  highlightId?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function formatExpires(iso: string, locale: Locale) {
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

export function MembersClient({
  locale,
  members,
  plans,
  labels,
  highlightId = null,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [planId, setPlanId] = useState("all");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!highlightId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`member-row-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(scrollTimer);
  }, [highlightId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (planId !== "all" && m.plan_id !== planId) return false;
      if (!q) return true;
      const hay = [m.name, m.email ?? "", m.phone ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, query, status, planId]);

  const emptyMessage =
    members.length === 0 ? labels.noMembers : labels.noResults;

  function reload() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", labels.filterAll],
                ["active", labels.filterActive],
                ["expired", labels.filterExpired],
              ] as const
            ).map(([key, label]) => {
              const selected = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-on)]"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {plans.length > 0 ? (
            <div className="w-full sm:w-auto sm:min-w-[12rem]">
              <label className="sr-only" htmlFor="members-plan-filter">
                {labels.filterPlan}
              </label>
              <Select
                id="members-plan-filter"
                variant="auth"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                <option value="all">{labels.filterPlanAll}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

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
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                <th className="px-4 py-3 sm:px-5">{labels.name}</th>
                <th className="px-4 py-3">{labels.plan}</th>
                <th className="px-4 py-3">{labels.status}</th>
                <th className="px-4 py-3">{labels.expires}</th>
                <th className="px-4 py-3 pr-5 text-right">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-[var(--color-muted)]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const active = m.status === "active";
                  const isNew = highlightId === m.id;
                  const href = `/${locale}/members/${m.id}`;
                  return (
                    <tr
                      key={m.id}
                      id={`member-row-${m.id}`}
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
                            <p className="truncate text-xs text-[var(--color-muted)]">
                              {m.email ?? m.phone ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                            m.plan_name
                              ? "bg-[var(--color-primary-soft)] text-[var(--color-text)]"
                              : "bg-[var(--color-surface-hover)] text-[var(--color-muted)]"
                          }`}
                        >
                          {m.plan_name ?? labels.noPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            active
                              ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                              : "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                          }`}
                        >
                          {active ? labels.active : labels.expired}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3.5 tabular-nums ${
                          active
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-danger)]"
                        }`}
                      >
                        {formatExpires(m.membership_expires_at, locale)}
                      </td>
                      <td className="px-4 py-3.5 pr-5 text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                          {labels.view}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
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
    </div>
  );
}
