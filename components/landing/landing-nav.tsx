"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { LandingDictionary, LandingSectionId } from "@/lib/i18n/landing-dictionaries";
import { sectionIdForNav } from "@/lib/i18n/landing-dictionaries";
import { ThemeToggle } from "@/components/theme-toggle";
import { AmrapLogo } from "./amrap-logo";

type NavKey = "home" | "focus" | "pricing" | "contact";

const navItems: { key: NavKey; section: LandingSectionId }[] = [
  { key: "home", section: sectionIdForNav("home") },
  { key: "focus", section: sectionIdForNav("focus") },
  { key: "pricing", section: sectionIdForNav("pricing") },
  { key: "contact", section: sectionIdForNav("contact") },
];

type Props = {
  locale: Locale;
  d: LandingDictionary;
  labels: Record<NavKey, string>;
};

export function LandingNav({ locale, d, labels }: Props) {
  const [active, setActive] = useState<LandingSectionId>("inicio");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = navItems
      .map((n) => document.getElementById(n.section))
      .filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id as LandingSectionId);
        }
      },
      { rootMargin: "-28% 0px -52% 0px", threshold: [0, 0.2, 0.4, 0.6] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const prefix = `/${locale}`;

  return (
    <header
      className={`landing-nav fixed inset-x-0 top-0 z-50 transition-[min-height,padding,background,box-shadow,border-color] duration-500 ease-out ${
        scrolled ? "landing-nav--scrolled" : ""
      }`}
    >
      <div className="landing-nav-inner mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-6 sm:px-8 lg:px-10">
        <Link href={prefix} className="flex shrink-0 items-center">
          <AmrapLogo priority className={scrolled ? "h-8 w-auto" : "h-10 w-auto transition-all duration-500"} />
        </Link>

        <nav className="landing-nav-links hidden items-center md:flex" aria-label="Main">
          {navItems.map(({ key, section }) => {
            const isActive = active === section;
            return (
              <button
                key={section}
                type="button"
                onClick={() => scrollTo(section)}
                className={`landing-nav-pill px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "landing-nav-pill--active"
                    : "text-[var(--landing-ink)] hover:bg-[var(--landing-ink)]/5"
                }`}
              >
                {labels[key]}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="!text-[var(--landing-ink)] hover:!bg-[var(--landing-ink)]/5" />
          <Link href={`${prefix}/login`} className="landing-nav-login">
            {d.nav.login}
          </Link>
        </div>
      </div>
    </header>
  );
}
