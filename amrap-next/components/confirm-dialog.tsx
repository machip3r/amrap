"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Shown on the confirm button while the action runs. Defaults to confirmLabel. */
  pendingLabel?: string;
  /** Server action or form action for the confirm submit. */
  action?: (formData: FormData) => void | Promise<void>;
  /** Extra hidden fields / body inside the form. */
  children?: ReactNode;
  /** Use danger styling on the confirm button. Default true. */
  danger?: boolean;
};

function ConfirmActions({
  cancelLabel,
  confirmLabel,
  pendingLabel,
  danger,
  onCancel,
}: {
  cancelLabel: string;
  confirmLabel: string;
  pendingLabel?: string;
  danger: boolean;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="ghost"
        className="rounded-lg px-4 py-2.5 text-sm font-semibold"
        onClick={onCancel}
        disabled={pending}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        variant="primary"
        className={`mt-0 inline-flex items-center justify-center gap-2 shadow-sm ${
          danger
            ? "bg-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:brightness-95"
            : ""
        }`}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
      </Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  cancelLabel,
  confirmLabel,
  pendingLabel,
  action,
  children,
  danger = true,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
      title={title}
      description={description}
      closeLabel={closeLabel}
      className="max-w-md"
      autoFocus={false}
    >
      <form
        action={async (formData) => {
          if (action) await action(formData);
          onOpenChange(false);
        }}
        className="flex flex-col gap-4"
      >
        {children}
        <ConfirmActions
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          danger={danger}
          onCancel={() => onOpenChange(false)}
        />
      </form>
    </Dialog>
  );
}
