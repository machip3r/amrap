"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { LandingDictionary } from "@/lib/i18n/landing-dictionaries";
import { LandingNav } from "./landing-nav";
import { LandingContact } from "./landing-contact";

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
    <div className="landing-page min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="landing-nav-spacer" aria-hidden />
      <LandingNav locale={locale} d={d} labels={navLabels} />

      <section id="start" className="landing-hero">
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
            <div className="landing-hero-brand">
              <Image
                src="/amrap-hero-logo-white.png"
                alt={d.hero.brand}
                width={1035}
                height={257}
                priority
                className="landing-hero-brand-logo"
              />
            </div>
            <h1 className="font-title landing-hero-title">{d.hero.title}</h1>
            <p className="landing-hero-subtitle">{d.hero.subtitle}</p>
            <div className="landing-hero-ctas">
              <Link href={`${prefix}/register`} className="landing-hero-primary">
                {d.hero.primaryCta}
              </Link>
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
        </div>
      </section>

      <section id="enfoque" className="landing-section">
        <div className="landing-container">
          <h2 className="font-title landing-section-title">{d.focus.title}</h2>
          <p className="landing-section-subtitle">{d.focus.subtitle}</p>
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

      <section id="precios" className="landing-section landing-section--muted">
        <div className="landing-container">
          <h2 className="font-title landing-section-title">{d.pricing.title}</h2>
          <p className="landing-pricing-subtitle">{d.pricing.subtitle}</p>
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
                {plan.note ? (
                  <p className="landing-price-note">{plan.note}</p>
                ) : null}
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
                <Link
                  href={
                    plan.cta === "contact"
                      ? "#contacto"
                      : `${prefix}/register`
                  }
                  className="landing-price-cta"
                  onClick={
                    plan.cta === "contact"
                      ? (e) => {
                          e.preventDefault();
                          document
                            .getElementById("contacto")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }
                      : undefined
                  }
                >
                  {plan.cta === "contact" ? d.pricing.contactCta : d.pricing.select}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingContact d={d} />

      <footer className="landing-footer">
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
            <h4 className="landing-footer-heading">{d.footer.legal}</h4>
            <ul className="landing-footer-list">
              {d.footer.legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
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
