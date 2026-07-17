"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Role } from "@/types";
import {
  getSidebarOpsNavItems,
  isOpsNavActive,
  opsNavHref,
  type OpsNavContext,
} from "@/lib/nav/ops-nav";
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  ChevronRight,
} from "lucide-react";
import { LogoutButton } from "./logout-button";
import { OpsNavLogo } from "./ops-nav-logo";

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

export type AppNavProps = {
  locale: Locale;
  role: Role;
  canManageSettings?: boolean;
  canManageStaff?: boolean;
  hiddenNavIds?: readonly string[];
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
  hiddenNavIds = [],
  logoUrlLight = null,
  logoUrlDark = null,
  gymName,
  organizationName,
  isProvisionalOwner = false,
}: AppNavProps) {
  const d = getDictionary(locale);
  const prefix = `/${locale}`;
  const pathname = usePathname();
  const ctx: OpsNavContext = {
    role,
    canManageSettings,
    canManageStaff,
    hiddenNavIds,
  };
  const items = getSidebarOpsNavItems(ctx);
  const collapsed = useSyncExternalStore(
    subscribeNavCollapsed,
    getNavCollapsedSnapshot,
    getNavCollapsedServerSnapshot,
  );

  const toggleCollapsed = useCallback(() => {
    setNavCollapsed(!getNavCollapsedSnapshot());
  }, []);

  const labelClass = collapsed ? "sr-only" : undefined;
  const orgHref = opsNavHref(prefix, "/organization");

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 md:flex ${
        collapsed ? "w-[4.5rem]" : "w-64"
      }`}
    >
      <div
        className={`flex shrink-0 border-b border-[var(--color-border)] ${
          collapsed
            ? "flex-col items-center gap-4 px-2 pb-3 pt-5"
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
          <OpsNavLogo
            logoUrlLight={logoUrlLight}
            logoUrlDark={logoUrlDark}
            gymName={gymName}
            size={collapsed ? "sm" : "md"}
          />
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
        {items.map((item) => {
          const href = opsNavHref(prefix, item.path);
          const active = isOpsNavActive(pathname, href);
          const Icon = item.icon;
          const label = item.getLabel(d);
          return (
            <Link
              key={item.id}
              className={navLinkClass(active, collapsed)}
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className={labelClass}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className={`space-y-2 border-t border-[var(--color-border)] py-4 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        {canManageSettings ? (
          <Link
            href={orgHref}
            className={
              collapsed
                ? navLinkClass(isOpsNavActive(pathname, orgHref), collapsed)
                : `flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-[var(--color-surface-hover)] ${
                    isOpsNavActive(pathname, orgHref)
                      ? "bg-[var(--color-primary-soft)]"
                      : ""
                  }`
            }
            aria-current={
              isOpsNavActive(pathname, orgHref) ? "page" : undefined
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
