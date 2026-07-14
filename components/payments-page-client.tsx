"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import {
  RegisterPaymentButton,
  type PaymentMemberOption,
  type PaymentPlanOption,
} from "@/components/register-payment-dialog";
import {
  PaymentsListClient,
  type PaymentListItem,
  type PaymentsListLabels,
} from "@/components/payments-list-client";

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  members: PaymentMemberOption[];
  plans: PaymentPlanOption[];
  dayPassPrice: number | null;
  payments: PaymentListItem[];
  labels: PaymentsListLabels;
  noMembersHint: string;
};

export function PaymentsPageClient({
  locale,
  title,
  subtitle,
  members,
  plans,
  dayPassPrice,
  payments,
  labels,
  noMembersHint,
}: Props) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    };
  }, []);

  function flashRow(id: string) {
    if (clearTimer.current != null) window.clearTimeout(clearTimer.current);
    setHighlightId(id);
    clearTimer.current = window.setTimeout(() => {
      setHighlightId(null);
      clearTimer.current = null;
    }, 3000);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
          {members.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">{noMembersHint}</p>
          ) : null}
        </div>
        <RegisterPaymentButton
          locale={locale}
          members={members}
          plans={plans}
          dayPassPrice={dayPassPrice}
          onSuccess={flashRow}
        />
      </header>

      <PaymentsListClient
        locale={locale}
        payments={payments}
        labels={labels}
        highlightId={highlightId}
      />
    </div>
  );
}
