"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { LandingDictionary } from "@/lib/i18n/landing-dictionaries";
import { LandingNav } from "./landing-nav";

const benefitIcons = ["⏱", "📈", "✓", "★"] as const;

type Props = {
  locale: Locale;
  d: LandingDictionary;
};

export function LandingPage({ locale, d }: Props) {
  const prefix = `/${locale}`;

  const navLabels = {
    home: d.nav.home,
    focus: d.nav.focus,
    pricing: d.nav.pricing,
    contact: d.nav.contact,
  };

  const mobileSections = [
    { id: "inicio", label: d.nav.home },
    { id: "enfoque", label: d.nav.focus },
    { id: "precios", label: d.nav.pricing },
    { id: "contacto", label: d.nav.contact },
  ] as const;

  return (
    <div className="landing-page min-h-screen bg-[var(--landing-bg)] text-[var(--landing-ink)]">
      <LandingNav locale={locale} d={d} labels={navLabels} />

      <section id="inicio" className="landing-hero-section scroll-mt-[100px]">
        <div className="landing-hero-blocks mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Block 1 — image + headline */}
          <article className="landing-hero-block landing-hero-block--media">
            <Image
              src="/images/hero-gym.png"
              alt=""
              fill
              priority
              className="landing-hero-image object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="landing-hero-noise" aria-hidden />
            <div className="landing-hero-media-overlay" aria-hidden />
            <div className="relative z-10 flex h-full items-center justify-center p-8 sm:p-12 lg:p-14">
              <h1 className="font-title max-w-xl text-center text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                {d.hero.titleBefore}
                <span className="text-[var(--landing-accent)]">{d.hero.titleHighlight}</span>
                {d.hero.titleAfter}
              </h1>
            </div>
          </article>

          {/* Block 2 — benefits */}
          <article className="landing-hero-block landing-hero-block--benefits">
            <ul className="flex h-full flex-col justify-center gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
              {d.hero.benefits.map((b, i) => (
                <li
                  key={b.verb}
                  className="landing-benefit-item flex gap-5"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="landing-benefit-icon" aria-hidden>
                    {benefitIcons[i]}
                  </span>
                  <div className="min-w-0">
                    <p className="font-title text-xl font-bold leading-tight text-white sm:text-2xl">
                      {b.verb}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/65 sm:text-[0.95rem]">
                      {b.rest}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Block 3 — CTA */}
          <Link
            href={`${prefix}/register`}
            className="landing-hero-block landing-hero-block--cta group"
          >
            <span className="font-title text-2xl font-bold text-white transition-transform duration-300 group-hover:scale-[1.02] sm:text-3xl lg:text-4xl">
              {d.hero.cta}
            </span>
          </Link>
        </div>

        <nav
          className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 pb-2 pt-6 md:hidden"
          aria-label="Sections"
        >
          {mobileSections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className="landing-nav-pill shrink-0 px-4 py-2 text-sm font-medium text-[var(--landing-ink)]"
            >
              {label}
            </button>
          ))}
        </nav>
      </section>

      <section id="enfoque" className="landing-section scroll-mt-[100px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-title text-3xl font-bold sm:text-4xl lg:text-5xl">{d.focus.title}</h2>
            <p className="mt-4 text-lg text-[var(--landing-muted)] sm:text-xl">{d.focus.subtitle}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {d.focus.items.map((item, i) => (
              <article key={item.title} className="landing-card">
                <span className="font-title text-sm font-bold text-[var(--landing-accent)]">
                  0{i + 1}
                </span>
                <h3 className="font-title mt-4 text-xl font-bold sm:text-2xl">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-[var(--landing-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section landing-section--alt scroll-mt-[100px]">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-title text-3xl font-bold sm:text-4xl lg:text-5xl">{d.pricing.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--landing-muted)] sm:text-xl">
            {d.pricing.subtitle}
          </p>
          <p className="mt-3 text-sm text-[var(--landing-muted)]">{d.pricing.note}</p>
          <Link href={`${prefix}/register`} className="landing-cta-pill mt-12 inline-flex">
            {d.pricing.cta}
          </Link>
        </div>
      </section>

      <section id="contacto" className="landing-section scroll-mt-[100px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="landing-card mx-auto max-w-lg p-8 text-center sm:p-12">
            <h2 className="font-title text-3xl font-bold sm:text-4xl">{d.contact.title}</h2>
            <p className="mt-4 text-[var(--landing-muted)]">{d.contact.subtitle}</p>
            <p className="mt-8 text-sm font-medium text-[var(--landing-muted)]">
              {d.contact.emailLabel}
            </p>
            <a
              href="mailto:hola@amrap.app"
              className="mt-1 inline-block font-title text-xl font-semibold text-[var(--landing-accent)] hover:underline"
            >
              hola@amrap.app
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--landing-border)] py-10 text-center text-sm text-[var(--landing-muted)]">
        © {new Date().getFullYear()} AMRAP
      </footer>
    </div>
  );
}
