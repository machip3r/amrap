"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  date: string;
  today: string;
  labels: {
    filterDate: string;
    filterApply: string;
    filterClear: string;
  };
};

export function CheckInHistoryFilters({ date, today, labels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply(formData: FormData) {
    const value = String(formData.get("date") ?? "").trim() || today;
    const params = new URLSearchParams();
    params.set("date", value);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function clear() {
    startTransition(() => {
      router.push(`?date=${today}`);
    });
  }

  const hasFilter = date !== today;

  return (
    <form
      action={apply}
      className="flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
    >
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <label
          htmlFor="checkin-date"
          className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]"
        >
          {labels.filterDate}
        </label>
        <Input
          id="checkin-date"
          name="date"
          type="date"
          variant="auth"
          className="block w-full min-w-0"
          defaultValue={date}
        />
      </div>
      <div className="flex w-full gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          className="min-w-0 flex-1"
        >
          {labels.filterApply}
        </Button>
        {hasFilter ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={clear}
            className="min-w-0 flex-1"
          >
            {labels.filterClear}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
