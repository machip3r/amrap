"use client";

import {
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const DIGITS = 6;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  label: string;
  error?: string;
  autoFocus?: boolean;
};

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, DIGITS);
}

export function OtpDigitsInput({
  value,
  onChange,
  onComplete,
  disabled,
  label,
  error,
  autoFocus = true,
}: Props) {
  const baseId = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: DIGITS }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function setDigit(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d));
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined);

    if (char && index < DIGITS - 1) {
      refs.current[index + 1]?.focus();
    }

    if (joined.length === DIGITS && next.every(Boolean)) {
      onComplete?.(joined);
    }
  }

  function handleChange(index: number, raw: string) {
    const cleaned = onlyDigits(raw);
    if (cleaned.length === 0) {
      setDigit(index, "");
      return;
    }
    if (cleaned.length === 1) {
      setDigit(index, cleaned);
      return;
    }
    // Multi-char (autocomplete / some mobile keyboards)
    const filled = onlyDigits(digits.join("").slice(0, index) + cleaned);
    onChange(filled);
    const focusAt = Math.min(filled.length, DIGITS - 1);
    refs.current[focusAt]?.focus();
    if (filled.length === DIGITS) onComplete?.(filled);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        e.preventDefault();
        setDigit(index - 1, "");
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < DIGITS - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = onlyDigits(e.clipboardData.getData("text"));
    if (!pasted) return;
    onChange(pasted);
    const focusAt = Math.min(pasted.length, DIGITS) - 1;
    refs.current[Math.max(0, focusAt)]?.focus();
    if (pasted.length === DIGITS) onComplete?.(pasted);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <div
        className="flex justify-between gap-2 sm:gap-3"
        role="group"
        aria-label={label}
      >
        {digits.map((digit, index) => {
          const id = `${baseId}-${index}`;
          const invalid = Boolean(error);
          return (
            <input
              key={id}
              id={index === 0 ? id : undefined}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={1}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              aria-label={`${label} ${index + 1}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={[
                "h-12 w-10 flex-1 rounded-lg border bg-[var(--color-surface-hover)] text-center font-title text-xl font-semibold text-[var(--color-text)] transition-colors sm:h-14 sm:w-12",
                "focus:outline-none focus:ring-1",
                invalid
                  ? "border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  : "border-[var(--color-border)] focus:border-[var(--color-ring)] focus:ring-[var(--color-ring)]",
                disabled ? "opacity-60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          );
        })}
      </div>
      {error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const OTP_LENGTH = DIGITS;
