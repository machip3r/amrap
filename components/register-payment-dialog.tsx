"use client";

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  createPayment,
  type CreatePaymentState,
} from "@/app/[locale]/(app)/payments/actions";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type PaymentMemberOption = {
  id: string;
  name: string;
  email?: string | null;
};

export type PaymentPlanOption = {
  id: string;
  name: string;
  price: number;
  duration_days: number;
};

type PaymentKind = "plan" | "day_pass";

type Props = {
  locale: Locale;
  members: PaymentMemberOption[];
  plans: PaymentPlanOption[];
  dayPassPrice: number | null;
  onSuccess?: (paymentId: string) => void;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = text.split(re);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={`${part}-${i}`}
            className="bg-transparent font-bold text-[var(--color-primary)]"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${i}`}>{part}</span>
        ),
      )}
    </>
  );
}

function MemberAutocomplete({
  locale,
  members,
  value,
  onChange,
  error,
}: {
  locale: Locale;
  members: PaymentMemberOption[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const d = getDictionary(locale);
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = members.find((m) => m.id === value) ?? null;

  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? members
      : members.filter((m) => {
          const hay = [m.name, m.email ?? ""].join(" ").toLowerCase();
          return hay.includes(q);
        });

    return [...list]
      .sort((a, b) => {
        if (!q) return a.name.localeCompare(b.name);
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [members, query]);

  const safeActiveIndex =
    filtered.length === 0
      ? 0
      : Math.min(activeIndex, filtered.length - 1);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected.name);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, selected]);

  function pick(member: PaymentMemberOption) {
    onChange(member.id);
    setQuery(member.name);
    setOpen(false);
    inputRef.current?.blur();
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        Math.min(i + 1, Math.max(filtered.length - 1, 0)),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pickMe = filtered[safeActiveIndex];
      if (pickMe) pick(pickMe);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      if (selected) setQuery(selected.name);
    }
  }

  const showList = open && filtered.length > 0;
  const showEmpty = open && query.trim().length > 0 && filtered.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name="member_id" value={value} required />
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList || showEmpty}
          aria-controls={listId}
          aria-activedescendant={
            showList && filtered[safeActiveIndex]
              ? `${listId}-opt-${filtered[safeActiveIndex]!.id}`
              : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder={d.payments.searchMember}
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setActiveIndex(0);
            setOpen(true);
            if (selected && next !== selected.name) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`h-11 w-full border bg-[var(--color-surface-hover)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] transition-[border-radius,border-color] duration-200 focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)] ${
            error
              ? "border-[var(--color-primary)] focus:border-[var(--color-primary)]"
              : "border-[var(--color-border)] focus:border-[var(--color-ring)]"
          } ${
            showList || showEmpty
              ? "rounded-t-lg rounded-b-none border-b-transparent focus:border-b-transparent"
              : "rounded-lg"
          }`}
        />
        {query || value ? (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            aria-label={d.payments.cancel}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {showList || showEmpty ? (
        <div
          id={listId}
          role="listbox"
          aria-label={d.payments.selectMember}
          className={`absolute left-0 right-0 top-full z-30 max-h-64 origin-top overflow-auto rounded-b-lg border border-t-0 bg-[var(--color-surface)] shadow-lg transition-opacity duration-200 ${
            error
              ? "border-[var(--color-primary)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {showEmpty ? (
            <p className="px-4 py-3 text-sm text-[var(--color-muted)]">
              {d.payments.noMemberMatches}
            </p>
          ) : (
            <ul className="py-1">
              {filtered.map((m, index) => {
                const active = index === safeActiveIndex;
                const isSelected = m.id === value;
                return (
                  <li
                    key={m.id}
                    id={`${listId}-opt-${m.id}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active || isSelected
                          ? "bg-[var(--color-primary-soft)]"
                          : "hover:bg-[var(--color-surface-hover)]"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => pick(m)}
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)]">
                        {m.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase() ?? "")
                          .join("") || "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[var(--color-text)]">
                          <HighlightMatch text={m.name} query={query} />
                        </span>
                        {m.email ? (
                          <span className="block truncate text-xs text-[var(--color-muted)]">
                            <HighlightMatch text={m.email} query={query} />
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-1.5 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatMoney(amount: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

function PaymentFormBody({
  locale,
  members,
  plans,
  dayPassPrice,
  onOpenChange,
  onSuccess,
}: {
  locale: Locale;
  members: PaymentMemberOption[];
  plans: PaymentPlanOption[];
  dayPassPrice: number | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (paymentId: string) => void;
}) {
  const d = getDictionary(locale);
  const router = useRouter();
  const amountId = useId();
  const methodId = useId();
  const planIdField = useId();
  const kindId = useId();
  const defaultKind: PaymentKind =
    plans.length > 0 ? "plan" : dayPassPrice != null ? "day_pass" : "plan";
  const [memberId, setMemberId] = useState("");
  const [kind, setKind] = useState<PaymentKind>(defaultKind);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [amount, setAmount] = useState(() => {
    if (defaultKind === "day_pass" && dayPassPrice != null) {
      return String(dayPassPrice);
    }
    return plans[0] != null ? String(plans[0].price) : "";
  });
  const [state, formAction, pending] = useActionState(
    createPayment,
    null as CreatePaymentState,
  );
  const fe = state?.fieldErrors;
  const canSubmit =
    Boolean(memberId) &&
    (kind === "day_pass"
      ? dayPassPrice != null
      : Boolean(planId) && plans.length > 0);

  useEffect(() => {
    if (!state?.success || !state.paymentId) return;
    onOpenChange(false);
    router.refresh();
    onSuccess?.(state.paymentId);
  }, [state, onOpenChange, router, onSuccess]);

  function applyKind(next: PaymentKind) {
    setKind(next);
    if (next === "day_pass") {
      setAmount(dayPassPrice != null ? String(dayPassPrice) : "");
      return;
    }
    const plan = plans.find((p) => p.id === planId) ?? plans[0] ?? null;
    if (plan && !planId) setPlanId(plan.id);
    setAmount(plan != null ? String(plan.price) : "");
  }

  function applyPlan(nextId: string) {
    setPlanId(nextId);
    const plan = plans.find((p) => p.id === nextId);
    if (plan) setAmount(String(plan.price));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="kind" value={kind} />
      <FormField label={d.payments.member} variant="auth">
        <MemberAutocomplete
          locale={locale}
          members={members}
          value={memberId}
          onChange={setMemberId}
          error={fe?.member_id}
        />
      </FormField>

      <div>
        <p
          id={kindId}
          className="mb-2 text-sm font-medium text-[var(--color-text)]"
        >
          {d.payments.kindLabel}
        </p>
        <div
          role="radiogroup"
          aria-labelledby={kindId}
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            role="radio"
            aria-checked={kind === "plan"}
            onClick={() => applyKind("plan")}
            disabled={plans.length === 0}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              kind === "plan"
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]"
            }`}
          >
            <span className="block font-semibold text-[var(--color-text)]">
              {d.payments.kindPlan}
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={kind === "day_pass"}
            onClick={() => applyKind("day_pass")}
            disabled={dayPassPrice == null}
            title={
              dayPassPrice == null ? d.payments.dayPassNotConfigured : undefined
            }
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              kind === "day_pass"
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-text)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-muted)] hover:border-[var(--color-ring)]"
            }`}
          >
            <span className="block font-semibold text-[var(--color-text)]">
              {d.payments.kindDayPass}
            </span>
            <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
              {dayPassPrice != null
                ? formatMoney(dayPassPrice, locale)
                : d.payments.dayPassNotConfigured}
            </span>
          </button>
        </div>
      </div>

      {kind === "plan" ? (
        <FormField
          label={d.payments.selectPlan}
          htmlFor={planIdField}
          variant="auth"
          error={fe?.plan_id}
        >
          {plans.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              {d.payments.noActivePlans}
            </p>
          ) : (
            <Select
              id={planIdField}
              name="plan_id"
              variant="auth"
              value={planId}
              onChange={(e) => applyPlan(e.target.value)}
              required
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatMoney(p.price, locale)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      ) : null}

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <FormField
          label={d.payments.amount}
          htmlFor={amountId}
          variant="auth"
          error={fe?.amount}
        >
          <Input
            id={amountId}
            required
            name="amount"
            type="number"
            min={0}
            max={1_000_000}
            step="0.01"
            inputMode="decimal"
            variant="auth"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormField>
        <FormField
          label={d.payments.method}
          htmlFor={methodId}
          variant="auth"
          error={fe?.method}
        >
          <Select id={methodId} name="method" defaultValue="cash" variant="auth">
            <option value="cash">{d.payments.cash}</option>
            <option value="transfer">{d.payments.transfer}</option>
          </Select>
        </FormField>
      </div>
      <p className="text-xs leading-snug text-[var(--color-muted)]">
        {d.payments.amountHint}
      </p>
      {state?.error && !state.success ? (
        <p
          className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-row-reverse flex-wrap items-center gap-3 pt-1">
        <Button
          type="submit"
          variant="primary"
          className="min-w-[8.5rem] flex-1 sm:flex-none"
          disabled={pending || !canSubmit}
        >
          {pending ? d.payments.submitting : d.payments.submit}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-w-[6rem] flex-1 px-4 py-2.5 sm:flex-none"
          onClick={() => onOpenChange(false)}
        >
          {d.payments.cancel}
        </Button>
      </div>
    </form>
  );
}

export function RegisterPaymentButton({
  locale,
  members,
  plans,
  dayPassPrice,
  onSuccess,
}: Props) {
  const d = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((n) => n + 1);
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm"
        onClick={() => setOpen(true)}
        disabled={members.length === 0}
        title={members.length === 0 ? d.payments.noMembers : undefined}
      >
        <Plus className="h-4 w-4" aria-hidden />
        {d.payments.newPayment}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={d.payments.newPayment}
        description={d.payments.description}
        closeLabel={d.payments.close}
        className="max-w-3xl sm:max-w-4xl"
        bodyClassName="overflow-visible px-8 py-6"
        autoFocus={false}
      >
        {open ? (
          members.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{d.payments.noMembers}</p>
          ) : (
            <PaymentFormBody
              key={session}
              locale={locale}
              members={members}
              plans={plans}
              dayPassPrice={dayPassPrice}
              onOpenChange={setOpen}
              onSuccess={onSuccess}
            />
          )
        ) : null}
      </Dialog>
    </>
  );
}
