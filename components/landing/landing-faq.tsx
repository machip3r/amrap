"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LandingDictionary } from "@/lib/i18n/landing-dictionaries";

type Props = {
  d: LandingDictionary;
};

export function LandingFaq({ d }: Props) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="preguntas" className="landing-section landing-section--muted">
      <div className="landing-container">
        <h2 className="font-title landing-section-title">{d.faq.title}</h2>
        <p className="landing-section-subtitle">{d.faq.subtitle}</p>
        <div className="landing-faq-list">
          {d.faq.items.map((item, index) => {
            const isOpen = open === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <div
                key={item.q}
                className={`landing-faq-item${isOpen ? " landing-faq-item--open" : ""}`}
              >
                <h3 className="landing-faq-q">
                  <button
                    id={buttonId}
                    type="button"
                    className="landing-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown className="landing-faq-chevron" aria-hidden />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="landing-faq-a"
                >
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
