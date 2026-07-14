"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { deleteMemberAction } from "@/app/[locale]/(app)/members/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  locale: Locale;
  memberId: string;
  memberName: string;
};

export function MemberDeleteSection({ locale, memberId, memberName }: Props) {
  const d = getDictionary(locale);
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {d.members.delete}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {d.members.confirmDelete}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="inline-flex shrink-0 items-center gap-1.5 self-start border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 sm:self-center"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {d.members.delete}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={d.members.delete}
        description={`${d.members.confirmDelete} (${memberName})`}
        closeLabel={d.members.cancel}
        cancelLabel={d.members.cancel}
        confirmLabel={d.members.delete}
        action={deleteMemberAction}
      >
        <input type="hidden" name="member_id" value={memberId} />
        <input type="hidden" name="locale" value={locale} />
      </ConfirmDialog>
    </>
  );
}
