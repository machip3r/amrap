"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  countryByIso2,
  flagEmoji,
  formatInternationalPhone,
  parseInternationalPhone,
} from "@/lib/phone/countries";
import type { InputVariant } from "@/components/ui/input";
import { LIMITS } from "@/lib/validation/schemas";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  /** Form field name for the combined international phone value. */
  name?: string;
  id?: string;
  locale: Locale;
  variant?: InputVariant;
  /** Controlled full international value (`+521…` or ""). */
  value?: string;
  defaultValue?: string;
  onChange?: (international: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  /** Accessible label for the country dial selector. */
  countryLabel: string;
  className?: string;
};

export function PhoneInput({
  name = "phone",
  id,
  locale,
  variant = "auth",
  value: valueProp,
  defaultValue = "",
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  placeholder,
  disabled,
  required,
  autoComplete = "tel-national",
  countryLabel,
  className = "",
}: Props) {
  const reactId = useId();
  const inputId = id ?? `${reactId}-phone`;
  const listId = `${reactId}-countries`;
  const rootRef = useRef<HTMLDivElement>(null);
  const controlled = valueProp !== undefined;

  const seed = parseInternationalPhone(
    (controlled ? valueProp : defaultValue) || "",
  );
  const seedIso =
    countryByIso2(seed.iso2)?.iso2 ??
    countryByIso2(defaultCountry)?.iso2 ??
    DEFAULT_PHONE_COUNTRY;

  const [iso2, setIso2] = useState(seedIso);
  const [national, setNational] = useState(seed.national);
  const [menuOpen, setMenuOpen] = useState(false);

  const dial = countryByIso2(iso2)?.dial ?? "52";
  const international = formatInternationalPhone(dial, national);

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);

  const [prevValue, setPrevValue] = useState(valueProp);
  if (controlled && valueProp !== prevValue) {
    setPrevValue(valueProp);
    const parsed = parseInternationalPhone(valueProp || "");
    const nextIso =
      valueProp === ""
        ? countryByIso2(defaultCountry)?.iso2 ?? DEFAULT_PHONE_COUNTRY
        : countryByIso2(parsed.iso2)?.iso2 ?? iso2;
    setIso2(nextIso);
    setNational(parsed.national);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function commit(nextIso: string, nextNational: string) {
    setIso2(nextIso);
    setNational(nextNational);
    const nextDial = countryByIso2(nextIso)?.dial ?? "52";
    onChange?.(formatInternationalPhone(nextDial, nextNational));
  }

  const isAuth = variant === "auth";
  const controlSurface = isAuth
    ? "h-11 box-border rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-sm text-[var(--color-text)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-70"
    : "h-8 box-border rounded border border-[var(--color-muted)]/40 bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:opacity-70";

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <input type="hidden" name={name} value={international} readOnly />
      <div className={`flex items-center ${isAuth ? "gap-2" : "gap-1.5"}`}>
        <div className="relative shrink-0 self-stretch">
          <button
            type="button"
            disabled={disabled}
            aria-label={countryLabel}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-controls={listId}
            onClick={() => setMenuOpen((o) => !o)}
            className={`inline-flex h-full items-center ${
              isAuth
                ? "gap-1.5 px-2.5 font-medium hover:border-[var(--color-ring)]"
                : "gap-1 px-2"
            } ${controlSurface}`}
          >
            <span className="text-[1rem] leading-none" aria-hidden>
              {flagEmoji(iso2)}
            </span>
            <span className="leading-none tabular-nums text-[var(--color-muted)]">
              +{dial}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-[var(--color-muted)] transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          {menuOpen ? (
            <ul
              id={listId}
              role="listbox"
              aria-label={countryLabel}
              className="absolute left-0 top-[calc(100%+0.35rem)] z-30 max-h-56 w-[min(18rem,calc(100vw-3rem))] overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
            >
              {PHONE_COUNTRIES.map((c) => {
                const label = displayNames?.of(c.iso2) ?? c.iso2;
                const selected = c.iso2 === iso2;
                return (
                  <li key={c.iso2} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-hover)] ${
                        selected
                          ? "bg-[var(--color-primary-soft)] font-medium text-[var(--color-text)]"
                          : "text-[var(--color-text)]"
                      }`}
                      onClick={() => {
                        commit(c.iso2, national);
                        setMenuOpen(false);
                      }}
                    >
                      <span className="text-[1rem] leading-none" aria-hidden>
                        {flagEmoji(c.iso2)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className="shrink-0 tabular-nums text-[var(--color-muted)]">
                        +{c.dial}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          maxLength={LIMITS.phone}
          placeholder={placeholder}
          value={national}
          onChange={(e) => commit(iso2, e.target.value)}
          className={`min-w-0 flex-1 leading-none placeholder-[var(--color-muted)] ${isAuth ? "px-4" : "px-2"} ${controlSurface}`}
        />
      </div>
    </div>
  );
}
