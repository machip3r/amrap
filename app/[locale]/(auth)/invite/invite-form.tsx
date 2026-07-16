"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import {
  acceptInviteAction,
  declineInviteAction,
  type InviteDecideState,
} from "./actions";

type Props = {
  locale: Locale;
};

export function InviteDecideForm({ locale }: Props) {
  const d = getDictionary(locale);
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptInviteAction,
    null as InviteDecideState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineInviteAction,
    null as InviteDecideState,
  );

  const pending = acceptPending || declinePending;
  const error = acceptState?.error ?? declineState?.error;

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {error}
        </p>
      ) : null}
      <form action={acceptAction}>
        <input type="hidden" name="locale" value={locale} />
        <Button
          type="submit"
          className="w-full"
          disabled={pending}
        >
          {acceptPending ? d.invite.accepting : d.invite.accept}
        </Button>
      </form>
      <form action={declineAction}>
        <input type="hidden" name="locale" value={locale} />
        <Button
          type="submit"
          variant="ghost"
          className="w-full"
          disabled={pending}
        >
          {declinePending ? d.invite.declining : d.invite.decline}
        </Button>
      </form>
    </div>
  );
}
