"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { removeTeamMemberAction } from "@/app/[locale]/(app)/team/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Props = {
  locale: Locale;
  listRole: "trainer" | "staff";
  teamMemberId: string;
  memberName: string;
};

export function TeamMemberRemoveSection({
  locale,
  listRole,
  teamMemberId,
  memberName,
}: Props) {
  const d = getDictionary(locale);
  const copy = listRole === "trainer" ? d.trainers : d.staffPage;
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-title text-lg font-bold text-[var(--color-text)]">
              {copy.remove}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {copy.confirmRemove}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="inline-flex shrink-0 items-center gap-1.5 self-start border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 sm:self-center"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {copy.remove}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={copy.remove}
        description={`${copy.confirmRemove} (${memberName})`}
        closeLabel={d.common.back}
        cancelLabel={d.members.cancel}
        confirmLabel={copy.remove}
        action={removeTeamMemberAction}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="team_member_id" value={teamMemberId} />
        <input type="hidden" name="list_role" value={listRole} />
      </ConfirmDialog>
    </>
  );
}
