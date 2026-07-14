"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
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
  PanelLeftClose,
  PanelLeftOpen,
  Dumbbell,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { LogoutButton } from "./logout-button";
import { AmrapLogo } from "./landing/amrap-logo";

const NAV_COLLAPSED_KEY = "amrap-nav-collapsed";
const NAV_COLLAPSED_EVENT = "amrap-nav-collapsed";

function subscribeNavCollapsed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(NAV_COLLAPSED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(NAV_COLLAPSED_EVENT, onStoreChange);
  };
}

function getNavCollapsedSnapshot() {
  try {
    return localStorage.getItem(NAV_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function getNavCollapsedServerSnapshot() {
  return false;
}

function setNavCollapsed(next: boolean) {
  try {
    localStorage.setItem(NAV_COLLAPSED_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(NAV_COLLAPSED_EVENT));
}

type NavProps = {
  locale: Locale;
  role: Role;
  canManageSettings?: boolean;
  canManageStaff?: boolean;
  logoUrlLight?: string | null;
  logoUrlDark?: string | null;
  gymName?: string;
  organizationName?: string;
  isProvisionalOwner?: boolean;
};

function navLinkClass(active: boolean, collapsed: boolean) {
  const layout = collapsed
    ? "w-full justify-center px-2 py-2.5"
    : "w-full gap-3 px-3 py-2";
  if (active) {
    return `flex items-center rounded-md bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-text)] transition-colors ${layout}`;
  }
  return `flex items-center rounded-md text-sm font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] ${layout}`;
}

export function AppNav({
  locale,
  role,
  canManageSettings = false,
  canManageStaff = false,
  logoUrlLight = null,
  logoUrlDark = null,
  gymName,
  organizationName,
  isProvisionalOwner = false,
}: NavProps) {
  const d = getDictionary(locale);
  const prefix = `/${locale}`;
  const pathname = usePathname();
  const lightLogo = logoUrlLight || logoUrlDark;
  const darkLogo = logoUrlDark || logoUrlLight;
  const hasCustomLogo = Boolean(lightLogo || darkLogo);
  const collapsed = useSyncExternalStore(
    subscribeNavCollapsed,
    getNavCollapsedSnapshot,
    getNavCollapsedServerSnapshot,
  );

  const toggleCollapsed = useCallback(() => {
    setNavCollapsed(!getNavCollapsedSnapshot());
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const labelClass = collapsed ? "sr-only" : undefined;

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 ${collapsed ? "w-[4.5rem]" : "w-64"
        }`}
    >
      <div
        className={`flex shrink-0 border-b border-[var(--color-border)] ${collapsed
          ? "flex-col items-center gap-4 pt-5 pb-3 px-2"
          : "h-16 items-center justify-between gap-2 px-4"
          }`}
      >
        <div
          className={
            collapsed
              ? "flex w-full items-center justify-center"
              : "min-w-0 flex-1"
          }
        >
          {hasCustomLogo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightLogo ?? darkLogo ?? ""}
                alt={gymName || "AMRAP"}
                className={`w-auto object-contain object-left dark:hidden ${
                  collapsed ? "h-6 max-w-[2.75rem]" : "h-9 max-w-full"
                }`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={darkLogo ?? lightLogo ?? ""}
                alt={gymName || "AMRAP"}
                className={`hidden w-auto object-contain object-left dark:block ${
                  collapsed ? "h-6 max-w-[2.75rem]" : "h-9 max-w-full"
                }`}
              />
            </>
          ) : (
            <AmrapLogo
              className={
                collapsed ? "h-6 w-auto max-w-[2.75rem]" : "h-9 w-auto max-w-full"
              }
            />
          )}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          aria-label={collapsed ? d.a11y.expandNav : d.a11y.collapseNav}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      <nav className={`flex-1 space-y-1 py-6 ${collapsed ? "px-2" : "px-3"}`}>
        <Link
          className={navLinkClass(isActive(`${prefix}/dashboard`), collapsed)}
          href={`${prefix}/dashboard`}
          aria-current={isActive(`${prefix}/dashboard`) ? "page" : undefined}
          title={collapsed ? d.nav.dashboard : undefined}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
          <span className={labelClass}>{d.nav.dashboard}</span>
        </Link>
        {can(role, "checkin") && (
          <Link
            className={navLinkClass(isActive(`${prefix}/checkin`), collapsed)}
            href={`${prefix}/checkin`}
            aria-current={isActive(`${prefix}/checkin`) ? "page" : undefined}
            title={collapsed ? d.nav.checkin : undefined}
          >
            <QrCode className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.checkin}</span>
          </Link>
        )}
        {can(role, "manage_members") && (
          <Link
            className={navLinkClass(isActive(`${prefix}/members`), collapsed)}
            href={`${prefix}/members`}
            aria-current={isActive(`${prefix}/members`) ? "page" : undefined}
            title={collapsed ? d.nav.members : undefined}
          >
            <Users className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.members}</span>
          </Link>
        )}
        {can(role, "manage_classes") && (
          <Link
            className={navLinkClass(isActive(`${prefix}/classes`), collapsed)}
            href={`${prefix}/classes`}
            aria-current={isActive(`${prefix}/classes`) ? "page" : undefined}
            title={collapsed ? d.nav.classes : undefined}
          >
            <CalendarDays className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.classes}</span>
          </Link>
        )}
        {(canManageStaff || can(role, "manage_staff")) && (
          <Link
            className={navLinkClass(isActive(`${prefix}/trainers`), collapsed)}
            href={`${prefix}/trainers`}
            aria-current={isActive(`${prefix}/trainers`) ? "page" : undefined}
            title={collapsed ? d.nav.trainers : undefined}
          >
            <Dumbbell className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.trainers}</span>
          </Link>
        )}
        {(canManageStaff || can(role, "manage_staff")) && (
          <Link
            className={navLinkClass(isActive(`${prefix}/staff`), collapsed)}
            href={`${prefix}/staff`}
            aria-current={isActive(`${prefix}/staff`) ? "page" : undefined}
            title={collapsed ? d.nav.staff : undefined}
          >
            <Briefcase className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.staff}</span>
          </Link>
        )}
        {can(role, "manage_plans") && (
          <Link
            className={navLinkClass(isActive(`${prefix}/plans`), collapsed)}
            href={`${prefix}/plans`}
            aria-current={isActive(`${prefix}/plans`) ? "page" : undefined}
            title={collapsed ? d.nav.plans : undefined}
          >
            <Layers className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.plans}</span>
          </Link>
        )}
        {can(role, "record_payment") && (
          <Link
            className={navLinkClass(isActive(`${prefix}/payments`), collapsed)}
            href={`${prefix}/payments`}
            aria-current={isActive(`${prefix}/payments`) ? "page" : undefined}
            title={collapsed ? d.nav.payments : undefined}
          >
            <CreditCard className="h-5 w-5 shrink-0" aria-hidden />
            <span className={labelClass}>{d.nav.payments}</span>
          </Link>
        )}
      </nav>

      <div
        className={`space-y-2 border-t border-[var(--color-border)] py-4 ${collapsed ? "px-2" : "px-3"
          }`}
      >
        {canManageSettings ? (
          <Link
            href={`${prefix}/organization`}
            className={
              collapsed
                ? navLinkClass(isActive(`${prefix}/organization`), collapsed)
                : `flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-[var(--color-surface-hover)] ${
                    isActive(`${prefix}/organization`)
                      ? "bg-[var(--color-primary-soft)]"
                      : ""
                  }`
            }
            aria-current={
              isActive(`${prefix}/organization`) ? "page" : undefined
            }
            title={
              collapsed
                ? organizationName || gymName || d.shell.gymAdmin
                : undefined
            }
          >
            {collapsed ? (
              <Building2 className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {organizationName || gymName || d.shell.gymAdmin}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {gymName && organizationName && gymName !== organizationName
                      ? gymName
                      : d.shell.gymAdmin}
                  </p>
                  {isProvisionalOwner ? (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                      {d.shell.provisionalOwner}
                    </p>
                  ) : null}
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--color-muted)]"
                  aria-hidden
                />
              </>
            )}
          </Link>
        ) : !collapsed ? (
          <div className="px-3">
            <p className="truncate text-sm font-semibold text-[var(--color-text)]">
              {gymName || d.shell.gymAdmin}
            </p>
            {isProvisionalOwner ? (
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {d.shell.provisionalOwner}
              </p>
            ) : null}
          </div>
        ) : null}
        <LogoutButton
          locale={locale}
          className={navLinkClass(false, collapsed)}
          title={collapsed ? d.nav.logout : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          <span className={labelClass}>{d.nav.logout}</span>
        </LogoutButton>
      </div>
    </aside>
  );
}
