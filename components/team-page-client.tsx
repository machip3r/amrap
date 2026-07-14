"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { TeamMember } from "@/lib/team/queries";
import {
  RegisterUserButton,
  type RegisterRole,
} from "@/components/register-user-dialog";
import {
  TeamListClient,
  type TeamListLabels,
} from "@/components/team-list-client";

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  newLabel: string;
  listRole: "trainer" | "staff";
  members: TeamMember[];
  labels: TeamListLabels;
  currentUserId: string;
};

export function TeamPageClient({
  locale,
  title,
  subtitle,
  newLabel,
  listRole,
  members,
  labels,
  currentUserId,
}: Props) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);
  const defaultRole: RegisterRole =
    listRole === "trainer" ? "trainer" : "staff";

  useEffect(() => {
    return () => {
      if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    };
  }, []);

  function flashRow(id: string) {
    if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    setHighlightId(id);
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
          canManageMembers={false}
          canManageStaff
          defaultRole={defaultRole}
          allowedRoles={[defaultRole]}
          label={newLabel}
          onSuccess={(payload) => {
            if (payload.teamMemberId) flashRow(payload.teamMemberId);
          }}
        />
      </header>

      <TeamListClient
        locale={locale}
        listRole={listRole}
        members={members}
        labels={labels}
        highlightId={highlightId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
