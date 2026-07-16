"use client";

import { useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

type MemberOpt = { personId: string; name: string };

type Props = {
  locale: Locale;
  sessionId: string;
  members: MemberOpt[];
  bookedPersonIds: string[];
  labels: {
    bookMember: string;
    selectMember: string;
    book: string;
  };
  action: (
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
};

export function ClassSessionBookForm({
  locale,
  sessionId,
  members,
  bookedPersonIds,
  labels,
  action,
}: Props) {
  const booked = new Set(bookedPersonIds);
  const available = members.filter((m) => !booked.has(m.personId));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (available.length === 0) return null;

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          const res = await action(fd);
          if (res.error) setError(res.error);
        });
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-sm font-semibold text-[var(--color-text)]">
        {labels.bookMember}
      </p>
      <select
        name="person_id"
        required
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
        defaultValue=""
      >
        <option value="" disabled>
          {labels.selectMember}
        </option>
        {available.map((m) => (
          <option key={m.personId} value={m.personId}>
            {m.name}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-sm text-[var(--color-primary)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {labels.book}
      </Button>
    </form>
  );
}
