"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { LandingDictionary } from "@/lib/i18n/landing-dictionaries";
import { LandingNav } from "./landing-nav";
import { LandingContact } from "./landing-contact";
import { LandingFaq } from "./landing-faq";

type Props = {
  locale: Locale;
  d: LandingDictionary;
};

export function LandingPage({ locale, d }: Props) {
  const prefix = `/${locale}`;
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const navLabels = {
    home: d.nav.home,
    product: d.nav.product,
    pricing: d.nav.pricing,
    faq: d.nav.faq,
    contact: d.nav.contact,
  };

  return (
    <div className="landing-page min-h-screen bg-(--color-bg) text-(--color-text)">
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
                  document.getElementById("proceso")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {d.hero.secondaryCta}
              </button>
            </div>
            <p className="landing-hero-trust">{d.hero.trust}</p>
          </div>
        </div>
      </section>

      <section className="landing-audience" aria-label={d.audience.title}>
        <div className="landing-container landing-audience-head">
          <p className="landing-audience-title">{d.audience.title}</p>
        </div>
        <div className="landing-marquee" aria-hidden>
          <div className="landing-marquee-track">
            {[...d.audience.items, ...d.audience.items].map((item, i) => (
              <span key={`${item}-${i}`} className="landing-marquee-item">
                {item}
              </span>
            ))}
          </div>
        </div>
        <ul className="landing-audience-sr">
          {d.audience.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="producto" className="landing-section">
        <div className="landing-container">
          <p className="landing-eyebrow">{d.difference.eyebrow}</p>
          <h2 className="font-title landing-section-title landing-section-title--left">
            {d.difference.title}
          </h2>
          <p className="landing-section-subtitle landing-section-subtitle--left">
            {d.difference.subtitle}
          </p>
          <div className="landing-diff-grid">
            {d.difference.items.map((item, index) => (
              <article key={item.title} className="landing-diff-item">
                <span className="landing-diff-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-title landing-diff-title">{item.title}</h3>
                <p className="landing-diff-body">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="landing-product-block">
            <h2 className="font-title landing-section-title landing-section-title--left">
              {d.product.title}
            </h2>
            <p className="landing-section-subtitle landing-section-subtitle--left">
              {d.product.subtitle}
            </p>
            <div className="landing-features-grid">
              {d.product.items.map((item) => (
                <article key={item.title} className="landing-feature">
                  <h3 className="font-title landing-feature-title">{item.title}</h3>
                  <p className="landing-feature-body">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="proceso" className="landing-section landing-section--muted landing-process">
        <div className="landing-container">
          <p className="landing-eyebrow">{d.process.eyebrow}</p>
          <h2 className="font-title landing-section-title">{d.process.title}</h2>
          <p className="landing-section-subtitle">{d.process.subtitle}</p>
          <ol className="landing-steps">
            {d.process.steps.map((step) => (
              <li key={step.step} className="landing-step">
                <span className="landing-step-num font-title" aria-hidden>
                  {step.step}
                </span>
                <h3 className="font-title landing-step-title">{step.title}</h3>
                <p className="landing-step-body">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="landing-process-cta">
            <Link href={`${prefix}/register`} className="landing-hero-primary">
              {d.process.cta}
            </Link>
          </div>
        </div>
      </section>

      <section id="precios" className="landing-section">
        <div className="landing-container">
          <h2 className="font-title landing-section-title">{d.pricing.title}</h2>
          <p className="landing-pricing-subtitle">{d.pricing.subtitle}</p>

          <div
            className="landing-billing-toggle"
            role="group"
            aria-label={`${d.pricing.monthly} / ${d.pricing.annual}`}
          >
            <button
              type="button"
              className={`landing-billing-btn${billing === "monthly" ? " landing-billing-btn--active" : ""}`}
              aria-pressed={billing === "monthly"}
              onClick={() => setBilling("monthly")}
            >
              {d.pricing.monthly}
            </button>
            <button
              type="button"
              className={`landing-billing-btn${billing === "annual" ? " landing-billing-btn--active" : ""}`}
              aria-pressed={billing === "annual"}
              onClick={() => setBilling("annual")}
            >
              {d.pricing.annual}
              <span className="landing-billing-save">{d.pricing.annualSave}</span>
            </button>
          </div>

          <div className="landing-pricing-grid">
            {d.pricing.plans.map((plan) => {
              const price =
                billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
              const period =
                billing === "annual" ? plan.periodAnnual : plan.periodMonthly;

              return (
                <article
                  key={plan.name}
                  className={`landing-price-card${plan.highlighted ? " landing-price-card--featured" : ""}`}
                >
                  {plan.badge ? (
                    <span className="landing-price-badge">{plan.badge}</span>
                  ) : null}
                  <h3 className="font-title landing-price-name">{plan.name}</h3>
                  <p className="landing-price-amount">
                    <span className="font-title">{price}</span>
                    {period ? (
                      <span className="landing-price-period">{period}</span>
                    ) : null}
                  </p>
                  <p className="landing-price-note">{plan.note}</p>
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
                      plan.cta === "contact" ? "#contacto" : `${prefix}/register`
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
                    {plan.cta === "contact"
                      ? d.pricing.contactCta
                      : d.pricing.select}
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="landing-pricing-tax">{d.pricing.taxNote}</p>
        </div>
      </section>

      <LandingFaq d={d} />

      <LandingContact d={d} />

      <section className="landing-cta-band">
        <div className="landing-container landing-cta-band-inner">
          <p className="landing-eyebrow landing-eyebrow--on-dark">{d.ctaBand.eyebrow}</p>
          <h2 className="font-title landing-cta-band-title">{d.ctaBand.title}</h2>
          <p className="landing-cta-band-subtitle">{d.ctaBand.subtitle}</p>
          <div className="landing-cta-band-actions">
            <Link href={`${prefix}/register`} className="landing-hero-primary">
              {d.ctaBand.primary}
            </Link>
            <Link href={`${prefix}/login`} className="landing-cta-band-secondary">
              {d.ctaBand.secondary}
            </Link>
          </div>
          <ul className="landing-cta-band-bullets">
            {d.ctaBand.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </section>

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
