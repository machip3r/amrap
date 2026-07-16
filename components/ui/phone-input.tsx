"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  countryByIso2,
  flagEmoji,
  formatInternationalPhone,
  nationalDigits,
  parseInternationalPhone,
} from "@/lib/phone/countries";
import type { InputVariant } from "@/components/ui/input";
import { LIMITS, sanitizePhoneInput } from "@/lib/validation/schemas";
import type { Locale } from "@/lib/i18n/config";

type Props = {
  /** Form field name — submitted value is E.164 (`+{dial}{10 digits}`) or empty. */
  name?: string;
  id?: string;
  locale: Locale;
  variant?: InputVariant;
  /** Controlled national value (digits only, max 10). */
  value?: string;
  defaultValue?: string;
  onChange?: (digits: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  /** Accessible label for the country dial selector. */
  countryLabel: string;
  className?: string;
};

function toNationalDigits(raw: string): string {
  const parsed = parseInternationalPhone(raw || "");
  const fromParse = nationalDigits(parsed.national);
  if (fromParse.length > 0) return sanitizePhoneInput(fromParse);
  return sanitizePhoneInput(raw);
}

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const controlled = valueProp !== undefined;

  const seedRaw = (controlled ? valueProp : defaultValue) || "";
  const seedParsed = parseInternationalPhone(seedRaw);
  const seedIso =
    countryByIso2(seedParsed.iso2)?.iso2 ??
    countryByIso2(defaultCountry)?.iso2 ??
    DEFAULT_PHONE_COUNTRY;

  const [iso2, setIso2] = useState(seedIso);
  const [national, setNational] = useState(() => toNationalDigits(seedRaw));
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const dial = countryByIso2(iso2)?.dial ?? "52";
  const submitted =
    national.length === LIMITS.phone
      ? formatInternationalPhone(dial, national)
      : "";

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
    setNational(toNationalDigits(valueProp || ""));
  }

  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(18 * 16, window.innerWidth - 24);
      let left = rect.left;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - width - 12);
      }
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const menuHeight = Math.min(14 * 16, spaceBelow > 160 ? spaceBelow : 224);
      const openUp = spaceBelow < 160 && rect.top > spaceBelow;
      setMenuPos({
        top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
        left,
        width,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        (target instanceof Element && target.closest(`#${CSS.escape(listId)}`))
      ) {
        return;
      }
      setMenuOpen(false);
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
  }, [menuOpen, listId]);

  function commit(nextIso: string, nextNational: string) {
    const digits = sanitizePhoneInput(nextNational);
    setIso2(nextIso);
    setNational(digits);
    onChange?.(digits);
  }

  const isAuth = variant === "auth";
  const controlSurface = isAuth
    ? "min-h-11 box-border rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-base text-[var(--color-text)] transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-70"
    : "min-h-11 box-border rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-bg)] text-base text-[var(--color-text)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] disabled:opacity-70";

  const menu =
    menuOpen && menuPos
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            aria-label={countryLabel}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: "14rem",
            }}
            className="z-[60] overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
          >
            {PHONE_COUNTRIES.map((c) => {
              const label = displayNames?.of(c.iso2) ?? c.iso2;
              const selected = c.iso2 === iso2;
              return (
                <li key={c.iso2} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left text-base transition-colors hover:bg-[var(--color-surface-hover)] ${
                      selected
                        ? "bg-[var(--color-primary-soft)] font-medium text-[var(--color-text)]"
                        : "text-[var(--color-text)]"
                    }`}
                    onClick={() => {
                      commit(c.iso2, national);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="text-[1.1rem] leading-none" aria-hidden>
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
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <input type="hidden" name={name} value={submitted} readOnly />
      <div className={`flex items-stretch ${isAuth ? "gap-2" : "gap-1.5"}`}>
        <div className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            aria-label={countryLabel}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-controls={listId}
            onClick={() => setMenuOpen((o) => !o)}
            className={`inline-flex h-full min-h-11 items-center ${
              isAuth
                ? "gap-1.5 px-3 font-medium hover:border-[var(--color-ring)]"
                : "gap-1 px-2.5"
            } ${controlSurface}`}
          >
            <span className="text-[1.1rem] leading-none" aria-hidden>
              {flagEmoji(iso2)}
            </span>
            <span className="leading-none tabular-nums text-[var(--color-muted)]">
              +{dial}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
          {menu}
        </div>

        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          maxLength={LIMITS.phone}
          pattern="\d{10}"
          placeholder={placeholder}
          value={national}
          onChange={(e) => commit(iso2, e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            commit(iso2, text);
          }}
          className={`min-w-0 flex-1 leading-none tabular-nums placeholder-[var(--color-muted)] ${isAuth ? "px-4" : "px-3"} ${controlSurface}`}
        />
      </div>
    </div>
  );
}
