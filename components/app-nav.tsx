import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";
import { can } from "@/lib/auth/permissions";
import { LayoutDashboard, QrCode, Users, CreditCard, Settings, LogOut, Plus } from "lucide-react";
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
    <aside className="w-64 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-16 shrink-0 flex-col justify-center px-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-title font-bold text-[var(--color-primary)] tracking-wide">
          Admin Central
        </h2>
        <p className="text-xs text-[var(--color-muted)]">Recepción</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        <Link className={linkCls} href={`${prefix}/dashboard`}>
          <LayoutDashboard className="h-5 w-5" />
          {d.nav.dashboard}
        </Link>
        {can(role, "checkin") && (
          <Link className={linkCls} href={`${prefix}/checkin`}>
            <QrCode className="h-5 w-5" />
            {d.nav.checkin}
          </Link>
        )}
        {can(role, "manage_members") && (
          <Link className={linkCls} href={`${prefix}/members`}>
            <Users className="h-5 w-5" />
            {d.nav.members}
          </Link>
        )}
        {can(role, "record_payment") && (
          <Link className={linkCls} href={`${prefix}/payments`}>
            <CreditCard className="h-5 w-5" />
            {d.nav.payments}
          </Link>
        )}

        <div className="pt-6 pb-2">
          <Link href={`${prefix}/members/new`} className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[var(--color-primary-hover)] transition-colors">
            <Plus className="h-5 w-5" />
            Nuevo Socio
          </Link>
        </div>
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 py-4 space-y-1">
        <Link className={linkCls} href={`${prefix}/settings`}>
          <Settings className="h-5 w-5" />
          Configuración
        </Link>
        <LogoutButton locale={locale} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors">
          <LogOut className="h-5 w-5" />
          {d.nav.logout}
        </LogoutButton>
      </div>
    </aside>
  );
}
