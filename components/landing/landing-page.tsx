"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { LandingDictionary } from "@/lib/i18n/landing-dictionaries";
import { LandingNav } from "./landing-nav";

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

  return (
    <div className="landing-page min-h-screen bg-[var(--landing-bg)] text-[var(--landing-ink)]">
      <LandingNav locale={locale} d={d} labels={navLabels} />

      <section id="inicio" className="landing-hero scroll-mt-[100px]">
        <div className="landing-hero-bg" aria-hidden>
          <Image
            src="/images/hero-gym.png"
            alt=""
            fill
            priority
            className="landing-hero-image object-cover object-center"
            sizes="100vw"
          />
          <div className="landing-hero-noise" />
          <div className="landing-hero-shade" />
        </div>

        <div className="landing-hero-content">
          <div className="landing-hero-copy">
            <h1 className="font-title landing-hero-title">
              {d.hero.titleBefore}
              <span className="text-[var(--landing-accent)]">{d.hero.titleHighlight}</span>
              {d.hero.titleAfter}
            </h1>
          </div>

          <div className="landing-hero-aside">
            <div className="landing-hero-glass">
              <ul className="landing-hero-benefits">
                {d.hero.benefits.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="landing-hero-secondary"
              onClick={() =>
                document.getElementById("enfoque")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {d.hero.secondaryCta}
            </button>
          </div>
        </div>
      </section>

      <section id="enfoque" className="landing-section scroll-mt-[100px]">
        <div className="landing-container">
          <h2 className="font-title landing-section-title">{d.focus.title}</h2>
          <div className="landing-features-grid">
            {d.focus.items.map((item) => (
              <article key={item.title} className="landing-feature">
                <h3 className="font-title landing-feature-title">{item.title}</h3>
                <p className="landing-feature-body">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section landing-section--muted scroll-mt-[100px]">
        <div className="landing-container">
          <h2 className="font-title landing-section-title">{d.pricing.title}</h2>
          <div className="landing-pricing-grid">
            {d.pricing.plans.map((plan) => (
              <article
                key={plan.name}
                className={`landing-price-card${plan.highlighted ? " landing-price-card--featured" : ""}`}
              >
                <h3 className="font-title landing-price-name">{plan.name}</h3>
                <p className="landing-price-amount">
                  <span className="font-title">{plan.price}</span>
                  <span className="landing-price-period">{plan.period}</span>
                </p>
                <ul className="landing-price-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="landing-check" aria-hidden>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`${prefix}/register`} className="landing-price-cta">
                  {d.pricing.select}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer id="contacto" className="landing-footer scroll-mt-[100px]">
        <div className="landing-container landing-footer-grid">
          <div className="landing-footer-brand">
            <Image
              src="/amrap-white-logo.png"
              alt="AMRAP"
              width={120}
              height={32}
              className="h-9 w-auto object-contain object-left"
            />
            <ul className="landing-footer-contact">
              <li>{d.footer.phone}</li>
              <li>
                <a href={`mailto:${d.footer.email}`}>{d.footer.email}</a>
              </li>
              <li>{d.footer.address}</li>
            </ul>
          </div>

          <div>
            <h4 className="landing-footer-heading">{d.footer.quickLinks}</h4>
            <ul className="landing-footer-list">
              {d.footer.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="landing-footer-heading">{d.footer.legal}</h4>
            <ul className="landing-footer-list">
              {d.footer.legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="landing-footer-heading">{d.footer.follow}</h4>
            <div className="landing-footer-social" aria-label={d.footer.follow}>
              {["𝕏", "f", "◎", "in"].map((s) => (
                <span key={s} className="landing-footer-social-dot">
                  {s}
                </span>
              ))}
            </div>
            <h4 className="landing-footer-heading mt-8">{d.footer.newsletter}</h4>
            <form
              className="landing-newsletter"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input
                type="email"
                name="email"
                placeholder={d.footer.newsletterPlaceholder}
                className="landing-newsletter-input"
                aria-label={d.footer.newsletterPlaceholder}
              />
              <button type="submit" className="landing-newsletter-btn">
                {d.footer.newsletterCta}
              </button>
            </form>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <div className="landing-container landing-footer-bottom-inner">
            <Image
              src="/amrap-white-logo.png"
              alt=""
              width={96}
              height={26}
              className="h-6 w-auto object-contain opacity-70"
            />
            <p>
              © {new Date().getFullYear()} {d.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
