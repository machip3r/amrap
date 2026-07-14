"use client";

import type { ReactNode } from "react";
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
  /** Server action or form action for the confirm submit. */
  action?: (formData: FormData) => void | Promise<void>;
  /** Extra hidden fields / body inside the form. */
  children?: ReactNode;
  pending?: boolean;
  /** Use danger styling on the confirm button. Default true. */
  danger?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  cancelLabel,
  confirmLabel,
  action,
  children,
  pending = false,
  danger = true,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      closeLabel={closeLabel}
      className="max-w-md"
      autoFocus={false}
    >
      <form action={action} className="flex flex-col gap-4">
        {children}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={`mt-0 shadow-sm ${
              danger
                ? "bg-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:brightness-95"
                : ""
            }`}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
