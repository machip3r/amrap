"use client";

import Link from "next/link";
import { Briefcase, Dumbbell, QrCode, UserPlus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import {
  RegisterUserButton,
  type RegisterPlanOption,
} from "@/components/register-user-dialog";

type Props = {
  locale: Locale;
  canCheckIn: boolean;
  canManageMembers: boolean;
  canManageStaff: boolean;
  plans: RegisterPlanOption[];
  labels: {
    quickActions: string;
    quickCheckIn: string;
    quickNewMember: string;
    quickNewTrainer: string;
    quickNewStaff: string;
  };
};

export function DashboardQuickActions({
  locale,
  canCheckIn,
  canManageMembers,
  canManageStaff,
  plans,
  labels,
}: Props) {
  const prefix = `/${locale}`;

  return (
    <section
      aria-label={labels.quickActions}
      className="grid w-full grid-cols-2 gap-2 lg:grid-cols-4"
    >
      {canCheckIn ? (
        <Link
          href={`${prefix}/checkin`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)]"
        >
          <QrCode className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          {labels.quickCheckIn}
        </Link>
      ) : null}
      {canManageMembers ? (
        <RegisterUserButton
          locale={locale}
          canManageMembers
          canManageStaff={false}
          plans={plans}
          defaultRole="member"
          allowedRoles={["member"]}
          label={labels.quickNewMember}
          appearance="quickAction"
          icon={
            <UserPlus className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          }
        />
      ) : null}
      {canManageStaff ? (
        <RegisterUserButton
          locale={locale}
          canManageMembers={false}
          canManageStaff
          defaultRole="trainer"
          allowedRoles={["trainer"]}
          label={labels.quickNewTrainer}
          appearance="quickAction"
          icon={
            <Dumbbell className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          }
        />
      ) : null}
      {canManageStaff ? (
        <RegisterUserButton
          locale={locale}
          canManageMembers={false}
          canManageStaff
          defaultRole="staff"
          allowedRoles={["staff"]}
          label={labels.quickNewStaff}
          appearance="quickAction"
          icon={
            <Briefcase
              className="h-4 w-4 text-[var(--color-primary)]"
              aria-hidden
            />
          }
        />
      ) : null}
    </section>
  );
}
