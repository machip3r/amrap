"use client";

import { useActionState, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  clearPendingConfirmAction,
  resendSignupOtpAction,
  verifySignupOtpAction,
  type ConfirmEmailState,
} from "@/app/[locale]/(auth)/confirm-email/actions";
import { OtpDigitsInput, OTP_LENGTH } from "@/components/ui/otp-digits-input";
import { Button } from "@/components/ui/button";

type Props = {
  locale: Locale;
  email: string;
};

export function ConfirmEmailForm({ locale, email }: Props) {
  const d = getDictionary(locale);
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifySignupOtpAction,
    null as ConfirmEmailState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendSignupOtpAction,
    null as ConfirmEmailState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [otp, setOtp] = useState("");
  const [prevVerifyState, setPrevVerifyState] = useState(verifyState);
  const displayEmail = verifyState?.email || resendState?.email || email;
  const error = verifyState?.error || resendState?.error;
  const otpError = verifyState?.fieldErrors?.otp;
  const success = resendState?.success;
  const canVerify = otp.length === OTP_LENGTH;

  if (verifyState !== prevVerifyState) {
    setPrevVerifyState(verifyState);
    if (verifyState?.fieldErrors?.otp || verifyState?.error) {
      setOtp("");
    }
  }

  function submitIfComplete(code: string) {
    if (code.length !== OTP_LENGTH || verifyPending) return;
    setOtp(code);
    requestAnimationFrame(() => {
      const hidden = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="otp"]',
      );
      if (hidden) hidden.value = code;
      formRef.current?.requestSubmit();
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 p-4 text-sm text-[var(--color-text)]">
        <p className="font-medium">{d.confirmEmail.sentTitle}</p>
        <p className="mt-1 text-[var(--color-muted)]">
          {d.confirmEmail.sentBody}{" "}
          <span className="font-semibold text-[var(--color-text)]">
            {displayEmail}
          </span>
        </p>
      </div>

      <form
        ref={formRef}
        action={verifyAction}
        className="flex flex-col gap-4"
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={displayEmail} />
        <input type="hidden" name="otp" value={otp} />

        <OtpDigitsInput
          label={d.confirmEmail.otpLabel}
          value={otp}
          onChange={setOtp}
          onComplete={submitIfComplete}
          disabled={verifyPending}
          error={otpError}
        />

        {error ? (
          <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm font-medium text-[var(--color-success)]" role="status">
            {success}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primaryBlock"
          disabled={verifyPending || !canVerify}
        >
          {verifyPending ? d.confirmEmail.verifying : d.confirmEmail.verify}
        </Button>
      </form>

      <form action={resendAction} className="flex flex-col gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="email" value={displayEmail} />
        <Button
          type="submit"
          variant="ghost"
          className="w-full py-2 text-sm"
          disabled={resendPending}
        >
          {resendPending ? d.confirmEmail.resending : d.confirmEmail.resend}
        </Button>
      </form>

      <form action={clearPendingConfirmAction} className="text-center">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="from" value="login" />
        <p className="text-sm text-[var(--color-muted)]">
          {d.confirmEmail.backToLoginPrompt}{" "}
          <Button type="submit" variant="link" className="inline p-0 align-baseline">
            {d.confirmEmail.backToLoginLink}
          </Button>
        </p>
      </form>
    </div>
  );
}
