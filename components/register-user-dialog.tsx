"use client";

import {
  Plus,
  UserRound,
  Dumbbell,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useEffectEvent,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  createMember,
  type CreateMemberState,
} from "@/app/[locale]/(app)/members/actions";
import {
  createStaffOrTrainer,
  type CreateTeamMemberState,
} from "@/app/[locale]/(app)/team/actions";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LIMITS, sanitizeEmailInput, sanitizePersonNameInput } from "@/lib/validation/schemas";

export type RegisterRole = "member" | "trainer" | "staff";

export type RegisterPlanOption = {
  id: string;
  name: string;
  price: number;
  duration_days: number;
};

export type RegisterSuccessPayload = {
  memberId?: string;
  teamMemberId?: string;
  role: RegisterRole;
};

type RegisterUserDialogProps = {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: RegisterRole;
  allowedRoles?: RegisterRole[];
  canManageMembers: boolean;
  canManageStaff: boolean;
  plans?: RegisterPlanOption[];
  onSuccess?: (payload: RegisterSuccessPayload) => void;
};

const ROLE_ICONS: Record<RegisterRole, LucideIcon> = {
  member: UserRound,
  trainer: Dumbbell,
  staff: Users,
};

function rolesForPermissions(
  canManageMembers: boolean,
  canManageStaff: boolean,
  allowedRoles?: RegisterRole[],
): RegisterRole[] {
  const base: RegisterRole[] = [];
  if (canManageMembers) base.push("member");
  if (canManageStaff) {
    base.push("trainer", "staff");
  }
  if (!allowedRoles) return base;
  return base.filter((r) => allowedRoles.includes(r));
}

function roleLabel(
  r: RegisterRole,
  d: ReturnType<typeof getDictionary>,
): string {
  if (r === "member") return d.registerUser.roleMember;
  if (r === "trainer") return d.registerUser.roleTrainer;
  return d.registerUser.roleStaff;
}

function formatPlanLabel(
  plan: RegisterPlanOption,
  template: string,
): string {
  const price =
    typeof plan.price === "number"
      ? plan.price.toFixed(2)
      : String(plan.price);
  const meta = template
    .replace("{days}", String(plan.duration_days))
    .replace("{price}", price);
  return `${plan.name} — ${meta}`;
}

type FormBodyProps = {
  locale: Locale;
  roles: RegisterRole[];
  initialRole: RegisterRole;
  plans?: RegisterPlanOption[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: (payload: RegisterSuccessPayload) => void;
};

function RegisterUserFormBody({
  locale,
  roles,
  initialRole,
  plans: plansProp,
  onOpenChange,
  onSuccess,
}: FormBodyProps) {
  const plans = plansProp ?? [];
  const d = getDictionary(locale);
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const planId = useId();
  const methodId = useId();
  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? "");
  const [method, setMethod] = useState<"cash" | "transfer">("cash");

  const [memberState, memberAction, memberPending] = useActionState(
    createMember,
    null as CreateMemberState,
  );
  const [teamState, teamAction, teamPending] = useActionState(
    createStaffOrTrainer,
    null as CreateTeamMemberState,
  );

  const isMember = role === "member";
  const state = isMember ? memberState : teamState;
  const pending = isMember ? memberPending : teamPending;
  const fe = state?.fieldErrors;

  const onMemberSuccess = useEffectEvent(() => {
    if (!memberState?.success) return;
    onSuccess?.({
      role: "member",
      memberId: memberState.memberId,
    });
    if (!memberState.emailWarning) {
      onOpenChange(false);
    }
  });

  const onTeamSuccess = useEffectEvent(() => {
    if (!teamState?.success) return;
    onSuccess?.({
      role: teamState.role ?? "staff",
      teamMemberId: teamState.teamMemberId,
    });
    if (!teamState.emailWarning) {
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (!memberState?.success) return;
    onMemberSuccess();
  }, [memberState]);

  useEffect(() => {
    if (!teamState?.success) return;
    onTeamSuccess();
  }, [teamState]);

  const nameOk = name.trim().length > 0;
  const emailOk = email.trim().length > 0;
  const planOk = selectedPlan.length > 0;
  const canSubmit = isMember
    ? nameOk && emailOk && planOk && plans.length > 0 && !pending
    : nameOk && emailOk && !pending;

  const actions = (
    <div className="flex flex-row-reverse flex-wrap items-center gap-3 pt-1">
      <Button
        type="submit"
        variant="primary"
        className="min-w-[8.5rem] flex-1 sm:flex-none"
        disabled={!canSubmit}
      >
        {pending ? d.registerUser.submitting : d.registerUser.submit}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="min-w-[6rem] flex-1 px-4 py-2.5 sm:flex-none"
        onClick={() => onOpenChange(false)}
      >
        {d.registerUser.cancel}
      </Button>
    </div>
  );

  const errorBanner =
    state?.error && !state.success ? (
      <p
        className="rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-3 text-sm font-medium text-[var(--color-primary)]"
        role="alert"
      >
        {state.error}
      </p>
    ) : null;

  const emailWarning =
    state && "emailWarning" in state && state.emailWarning ? (
      <p
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-muted)]"
        role="status"
      >
        {state.emailWarning}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-[var(--color-text)]">
          {d.registerUser.roleLabel}
        </legend>
        <div
          role="radiogroup"
          aria-label={d.registerUser.roleLabel}
          className={`grid gap-1 rounded-xl bg-[var(--color-surface-hover)] p-1 ${
            roles.length === 1
              ? "grid-cols-1"
              : roles.length === 2
                ? "grid-cols-2"
                : "grid-cols-3"
          }`}
        >
          {roles.map((r) => {
            const selected = role === r;
            const Icon = ROLE_ICONS[r];
            return (
              <label
                key={r}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold transition-all sm:text-sm ${
                  selected
                    ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm ring-1 ring-[var(--color-border)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <input
                  type="radio"
                  name="register-role"
                  value={r}
                  checked={selected}
                  onChange={() => setRole(r)}
                  className="sr-only"
                />
                <Icon
                  className={`h-4 w-4 ${
                    selected
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-muted)]"
                  }`}
                  aria-hidden
                />
                {roleLabel(r, d)}
              </label>
            );
          })}
        </div>
      </fieldset>

      {isMember ? (
        plans.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-muted)]"
              role="status"
            >
              {d.registerUser.noPlans}
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-center text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {d.registerUser.cancel}
            </button>
          </div>
        ) : (
          <form action={memberAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={d.members.name}
                htmlFor={nameId}
                variant="auth"
                error={fe?.name}
              >
                <Input
                  id={nameId}
                  required
                  name="name"
                  variant="auth"
                  maxLength={LIMITS.personName}
                  autoComplete="name"
                  placeholder={d.registerUser.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(sanitizePersonNameInput(e.target.value))}
                />
              </FormField>
              <FormField
                label={d.registerUser.email}
                htmlFor={emailId}
                variant="auth"
                error={fe?.email}
              >
                <Input
                  id={emailId}
                  required
                  type="email"
                  name="email"
                  variant="auth"
                  maxLength={LIMITS.email}
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  placeholder={d.registerUser.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                />
              </FormField>
            </div>
            <FormField
              label={d.members.phone}
              htmlFor={phoneId}
              variant="auth"
              error={fe?.phone}
            >
              <PhoneInput
                id={phoneId}
                name="phone"
                locale={locale}
                variant="auth"
                countryLabel={d.registerUser.countryCode}
                placeholder={d.registerUser.phonePlaceholder}
                value={phone}
                onChange={setPhone}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={d.members.selectPlan}
                htmlFor={planId}
                variant="auth"
                error={fe?.plan_id}
              >
                <Select
                  id={planId}
                  required
                  name="plan_id"
                  variant="auth"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPlanLabel(p, d.registerUser.planPrice)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label={d.members.paymentMethod}
                htmlFor={methodId}
                variant="auth"
                error={fe?.method}
              >
                <Select
                  id={methodId}
                  name="method"
                  variant="auth"
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as "cash" | "transfer")
                  }
                >
                  <option value="cash">{d.members.cash}</option>
                  <option value="transfer">{d.members.transfer}</option>
                </Select>
              </FormField>
            </div>
            {errorBanner}
            {emailWarning}
            {actions}
          </form>
        )
      ) : (
        <form action={teamAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="role" value={role} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={d.members.name}
              htmlFor={nameId}
              variant="auth"
              error={fe?.name}
            >
              <Input
                id={nameId}
                required
                name="name"
                variant="auth"
                maxLength={LIMITS.personName}
                autoComplete="name"
                placeholder={d.registerUser.namePlaceholder}
                value={name}
                onChange={(e) => setName(sanitizePersonNameInput(e.target.value))}
              />
            </FormField>
            <FormField
              label={d.registerUser.email}
              htmlFor={emailId}
              variant="auth"
              error={fe?.email}
            >
              <Input
                id={emailId}
                required
                type="email"
                name="email"
                variant="auth"
                maxLength={LIMITS.email}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                placeholder={d.registerUser.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
              />
            </FormField>
          </div>
          <FormField
            label={d.members.phone}
            htmlFor={phoneId}
            variant="auth"
            error={fe?.phone}
          >
            <PhoneInput
              id={phoneId}
              name="phone"
              locale={locale}
              variant="auth"
              countryLabel={d.registerUser.countryCode}
              placeholder={d.registerUser.phonePlaceholder}
              value={phone}
              onChange={setPhone}
            />
          </FormField>
          {errorBanner}
          {emailWarning}
          {actions}
        </form>
      )}
    </div>
  );
}

export function RegisterUserDialog({
  locale,
  open,
  onOpenChange,
  defaultRole = "member",
  allowedRoles,
  canManageMembers,
  canManageStaff,
  plans = [],
  onSuccess,
}: RegisterUserDialogProps) {
  const d = getDictionary(locale);
  const roles = rolesForPermissions(
    canManageMembers,
    canManageStaff,
    allowedRoles,
  );
  const initialRole =
    roles.includes(defaultRole) ? defaultRole : (roles[0] ?? "member");
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((n) => n + 1);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={d.registerUser.title}
      description={d.registerUser.description}
      closeLabel={d.registerUser.close}
      className="max-w-xl sm:max-w-2xl"
    >
      {roles.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{d.common.forbidden}</p>
      ) : open ? (
        <RegisterUserFormBody
          key={session}
          locale={locale}
          roles={roles}
          initialRole={initialRole}
          plans={plans}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  );
}

type RegisterUserButtonProps = {
  locale: Locale;
  canManageMembers: boolean;
  canManageStaff: boolean;
  plans?: RegisterPlanOption[];
  defaultRole?: RegisterRole;
  allowedRoles?: RegisterRole[];
  label?: string;
  className?: string;
  /** Default is primary filled; quickAction matches dashboard chips */
  appearance?: "primary" | "quickAction";
  icon?: ReactNode;
  onSuccess?: (payload: RegisterSuccessPayload) => void;
};

export function RegisterUserButton({
  locale,
  canManageMembers,
  canManageStaff,
  plans = [],
  defaultRole,
  allowedRoles,
  label,
  className = "",
  appearance = "primary",
  icon,
  onSuccess,
}: RegisterUserButtonProps) {
  const d = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const roles = rolesForPermissions(
    canManageMembers,
    canManageStaff,
    allowedRoles,
  );
  if (roles.length === 0) return null;

  const triggerClass =
    appearance === "quickAction"
      ? `inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-hover)] ${className}`.trim()
      : `inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 shadow-sm transition-[background-color,box-shadow,transform,filter] duration-200 hover:brightness-[0.92] hover:shadow-md active:translate-y-px active:brightness-[0.88] active:shadow-sm ${className}`.trim();

  return (
    <>
      {appearance === "quickAction" ? (
        <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
          {icon ?? <Plus className="h-4 w-4" aria-hidden />}
          {label ?? d.registerUser.open}
        </button>
      ) : (
        <Button
          type="button"
          variant="primary"
          className={triggerClass}
          onClick={() => setOpen(true)}
        >
          {icon ?? <Plus className="h-4 w-4" aria-hidden />}
          {label ?? d.registerUser.open}
        </Button>
      )}
      <RegisterUserDialog
        locale={locale}
        open={open}
        onOpenChange={setOpen}
        defaultRole={defaultRole}
        allowedRoles={allowedRoles}
        canManageMembers={canManageMembers}
        canManageStaff={canManageStaff}
        plans={plans}
        onSuccess={onSuccess}
      />
    </>
  );
}
