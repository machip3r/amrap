"use client";

import { useActionState, useId, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  completeWelcomeProfileAction,
  type WelcomeActionState,
} from "./actions";
import type { WelcomeRole } from "@/lib/auth/profile-onboarding";
import {
  maxDateOfBirthIso,
  minDateOfBirthIso,
} from "@/lib/validation/schemas";

type Props = {
  locale: Locale;
  role: WelcomeRole;
  defaultDateOfBirth?: string | null;
  defaultSex?: string | null;
  defaultHeightCm?: number | null;
  defaultWeightKg?: number | null;
};

export function WelcomeProfileForm({
  locale,
  role,
  defaultDateOfBirth = "",
  defaultSex = "",
  defaultHeightCm = null,
  defaultWeightKg = null,
}: Props) {
  const d = getDictionary(locale);
  const dobId = useId();
  const sexId = useId();
  const heightId = useId();
  const weightId = useId();
  const [state, formAction, pending] = useActionState(
    completeWelcomeProfileAction,
    null as WelcomeActionState,
  );
  const fe = state?.fieldErrors;
  const isMember = role === "member";
  const dobMax = maxDateOfBirthIso();
  const dobMin = minDateOfBirthIso();

  const [dob, setDob] = useState(defaultDateOfBirth ?? "");
  const [sex, setSex] = useState(defaultSex ?? "");
  const [height, setHeight] = useState(
    defaultHeightCm != null ? String(defaultHeightCm) : "",
  );
  const [weight, setWeight] = useState(
    defaultWeightKg != null ? String(defaultWeightKg) : "",
  );

  const canSubmit = isMember
    ? dob.length > 0 &&
      sex.length > 0 &&
      height.trim().length > 0 &&
      weight.trim().length > 0 &&
      !pending
    : dob.length > 0 && !pending;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormField
        label={d.welcome.dateOfBirth}
        htmlFor={dobId}
        variant="auth"
        error={fe?.date_of_birth}
      >
        <Input
          id={dobId}
          name="date_of_birth"
          type="date"
          required
          variant="auth"
          min={dobMin}
          max={dobMax}
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
      </FormField>

      {isMember ? (
        <>
          <FormField
            label={d.welcome.sex}
            htmlFor={sexId}
            variant="auth"
            error={fe?.sex}
          >
            <Select
              id={sexId}
              name="sex"
              required
              variant="auth"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="" disabled>
                {d.welcome.sex}
              </option>
              <option value="male">{d.welcome.sexMale}</option>
              <option value="female">{d.welcome.sexFemale}</option>
              <option value="other">{d.welcome.sexOther}</option>
              <option value="prefer_not">{d.welcome.sexPreferNot}</option>
            </Select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={d.welcome.heightCm}
              htmlFor={heightId}
              variant="auth"
              error={fe?.height_cm}
            >
              <Input
                id={heightId}
                name="height_cm"
                type="number"
                inputMode="decimal"
                required
                min={50}
                max={250}
                step={0.1}
                variant="auth"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </FormField>
            <FormField
              label={d.welcome.weightKg}
              htmlFor={weightId}
              variant="auth"
              error={fe?.weight_kg}
            >
              <Input
                id={weightId}
                name="weight_kg"
                type="number"
                inputMode="decimal"
                required
                min={20}
                max={400}
                step={0.1}
                variant="auth"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </FormField>
          </div>
        </>
      ) : null}

      {state?.error ? (
        <p className="text-sm font-medium text-[var(--color-primary)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primaryBlock"
        disabled={!canSubmit}
      >
        {pending ? d.welcome.submitting : d.welcome.submit}
      </Button>
    </form>
  );
}
