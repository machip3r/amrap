import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";
import { can } from "@/lib/auth/permissions";
import {
  LayoutDashboard,
  QrCode,
  Users,
  CreditCard,
  Layers,
  LogOut,
  Plus,
} from "lucide-react";
import { LogoutButton } from "./logout-button";

type NavProps = {
  locale: Locale;
  role: Role;
};

export function AppNav({ locale, role }: NavProps) {
  const d = getDictionary(locale);
  const prefix = `/${locale}`;

  const linkCls =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors";

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-16 shrink-0 flex-col justify-center border-b border-[var(--color-border)] px-6">
        <h2 className="font-title text-lg font-bold tracking-wide text-[var(--color-primary)]">
          {d.nav.brandTitle}
        </h2>
        <p className="text-xs text-[var(--color-muted)]">{d.nav.brandSubtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        <Link className={linkCls} href={`${prefix}/dashboard`}>
          <LayoutDashboard className="h-5 w-5" aria-hidden />
          {d.nav.dashboard}
        </Link>
        {can(role, "checkin") && (
          <Link className={linkCls} href={`${prefix}/checkin`}>
            <QrCode className="h-5 w-5" aria-hidden />
            {d.nav.checkin}
          </Link>
        )}
        {can(role, "manage_members") && (
          <Link className={linkCls} href={`${prefix}/members`}>
            <Users className="h-5 w-5" aria-hidden />
            {d.nav.members}
          </Link>
        )}
        {can(role, "record_payment") && (
          <Link className={linkCls} href={`${prefix}/payments`}>
            <CreditCard className="h-5 w-5" aria-hidden />
            {d.nav.payments}
          </Link>
        )}
        {can(role, "manage_plans") && (
          <Link className={linkCls} href={`${prefix}/plans`}>
            <Layers className="h-5 w-5" aria-hidden />
            {d.nav.plans}
          </Link>
        )}

        {can(role, "manage_members") && (
          <div className="pb-2 pt-6">
            <Link
              href={`${prefix}/members`}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors duration-200 hover:bg-[var(--color-primary-hover)]"
            >
              <Plus className="h-5 w-5" aria-hidden />
              {d.members.newMember}
            </Link>
          </div>
        )}
      </nav>

      <div className="space-y-1 border-t border-[var(--color-border)] px-3 py-4">
        <LogoutButton
          locale={locale}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          {d.nav.logout}
        </LogoutButton>
      </div>
    </aside>
  );
}
