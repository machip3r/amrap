"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LandingDictionary, LandingSectionId } from "@/lib/i18n/landing-dictionaries";
import { sectionIdForNav } from "@/lib/i18n/landing-dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { AmrapLogo } from "./amrap-logo";

type NavKey = "home" | "product" | "pricing" | "faq" | "contact";

const navItems: { key: NavKey; section: LandingSectionId }[] = [
  { key: "home", section: sectionIdForNav("home") },
  { key: "product", section: sectionIdForNav("product") },
  { key: "pricing", section: sectionIdForNav("pricing") },
  { key: "faq", section: sectionIdForNav("faq") },
  { key: "contact", section: sectionIdForNav("contact") },
];

type Props = {
  locale: Locale;
  d: LandingDictionary;
  labels: Record<NavKey, string>;
};

export function LandingNav({ locale, d, labels }: Props) {
  const [active, setActive] = useState<LandingSectionId>("start");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((n) => document.getElementById(n.section))
      .filter((el): el is HTMLElement => el != null);

    if (sections.length === 0) return;

    const lastId = sections[sections.length - 1]!.id as LandingSectionId;

    function updateActive() {
      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollBottom >= docHeight - 120) {
        setActive(lastId);
        return;
      }

      const marker = window.innerHeight * 0.32;
      let current: LandingSectionId = sections[0]!.id as LandingSectionId;

      for (const el of sections) {
        if (el.getBoundingClientRect().top <= marker) {
          current = el.id as LandingSectionId;
        }
      }

      setActive(current);
    }

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    function onResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  function scrollTo(id: string) {
    setActive(id as LandingSectionId);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const prefix = `/${locale}`;
  const menuLabel = menuOpen ? d.nav.closeMenu : d.nav.openMenu;

  return (
    <>
      <header
        className={`landing-nav fixed z-50 ${scrolled ? "landing-nav--scrolled" : "landing-nav--top"} ${
          menuOpen ? "landing-nav--menu-open" : ""
        }`}
      >
        <div className="landing-nav-bar">
          <Link
            href={`${prefix}#start`}
            className="landing-nav-brand"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              setActive("start");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <AmrapLogo priority className="landing-nav-logo w-auto" />
          </Link>

          <nav className="landing-nav-desktop" aria-label={d.nav.mainAria}>
            {navItems.map(({ key, section }) => {
              const isActive = active === section;
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => scrollTo(section)}
                  className={`landing-nav-pill ${
                    isActive ? "landing-nav-pill--active" : ""
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </nav>

          <div className="landing-nav-actions">
            <Link
              href={`${prefix}/login`}
              className="landing-nav-login"
              onClick={() => setMenuOpen(false)}
            >
              {d.nav.login}
            </Link>
            <Link
              href={`${prefix}/register`}
              className="landing-nav-start"
              onClick={() => setMenuOpen(false)}
            >
              {d.nav.start}
            </Link>
            <button
              type="button"
              className="landing-nav-burger"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuLabel}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div id={menuId} className="landing-nav-sheet">
            <nav className="landing-nav-sheet-nav" aria-label={d.nav.mainAria}>
              {navItems.map(({ key, section }) => {
                const isActive = active === section;
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => scrollTo(section)}
                    className={`landing-nav-sheet-link ${
                      isActive ? "landing-nav-sheet-link--active" : ""
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}
              <Link
                href={`${prefix}/register`}
                className="landing-nav-sheet-cta"
                onClick={() => setMenuOpen(false)}
              >
                {d.nav.start}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <div className="landing-theme-fab-wrap">
        <ThemeToggle label={d.nav.toggleTheme} className="landing-theme-fab-btn" />
      </div>
    </>
  );
}
