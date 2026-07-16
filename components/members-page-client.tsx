"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { History } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Member } from "@/types";
import {
  RegisterUserButton,
  type RegisterPlanOption,
} from "@/components/register-user-dialog";
import {
  MembersClient,
  type MembersPageLabels,
} from "@/components/members-client";
import type { PageMeta } from "@/lib/pagination";

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  newMemberLabel: string;
  checkInHistoryLabel: string;
  showCheckInHistory?: boolean;
  members: Member[];
  plans: { id: string; name: string }[];
  activePlans: RegisterPlanOption[];
  labels: MembersPageLabels;
  meta: PageMeta;
  filters: {
    q: string;
    status: "all" | "active" | "expired";
    planId: string;
  };
};

export function MembersPageClient({
  locale,
  title,
  subtitle,
  newMemberLabel,
  checkInHistoryLabel,
  showCheckInHistory = false,
  members,
  plans,
  activePlans,
  labels,
  meta,
  filters,
}: Props) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    };
  }, []);

  function flashRow(memberId: string) {
    if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    setHighlightId(memberId);
    clearTimer.current = window.setTimeout(() => {
      setHighlightId(null);
      clearTimer.current = null;
    }, 3000);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showCheckInHistory ? (
            <Link
              href={`/${locale}/checkin/history`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <History className="h-4 w-4" aria-hidden />
              {checkInHistoryLabel}
            </Link>
          ) : null}
          <RegisterUserButton
            locale={locale}
            canManageMembers
            canManageStaff={false}
            plans={activePlans}
            defaultRole="member"
            allowedRoles={["member"]}
            label={newMemberLabel}
            onSuccess={(payload) => {
              if (payload.memberId) flashRow(payload.memberId);
            }}
          />
        </div>
      </header>

      <MembersClient
        locale={locale}
        members={members}
        plans={plans}
        labels={labels}
        meta={meta}
        filters={filters}
        highlightId={highlightId}
      />
    </div>
  );
}
