"use client";

import { useEffect, useRef, useState } from "react";
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

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  newMemberLabel: string;
  members: Member[];
  plans: { id: string; name: string }[];
  activePlans: RegisterPlanOption[];
  labels: MembersPageLabels;
};

export function MembersPageClient({
  locale,
  title,
  subtitle,
  newMemberLabel,
  members,
  plans,
  activePlans,
  labels,
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
      </header>

      <MembersClient
        locale={locale}
        members={members}
        plans={plans}
        labels={labels}
        highlightId={highlightId}
      />
    </div>
  );
}
