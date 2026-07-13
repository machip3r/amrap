"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Building2,
  CreditCard,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  RotateCcw,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { OrgPlanTier } from "@/types";
import {
  AMRAP_PLANS,
  ORG_DELETION_RETENTION_DAYS,
  canCreateGym,
  maxGyms,
} from "@/lib/plans/limits";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/validation/schemas";
import {
  requestSubscriptionCheckout,
  requestCreateGym,
  scheduleGymDeletion,
  cancelGymDeletion,
  scheduleOrganizationDeletion,
  type OrgActionState,
} from "@/app/[locale]/(app)/organization/actions";

export type OrgGymRow = {
  id: string;
  name: string;
  deleted_at: string | null;
  isCurrent: boolean;
};

export type OrganizationLabels = {
  title: string;
  subtitle: string;
  currentPlan: string;
  subscriptionTitle: string;
  gymsTitle: string;
  gymsHint: string;
  addGym: string;
  addGymTitle: string;
  addGymDescription: string;
  gymName: string;
  currentGym: string;
  scheduledDeletion: string;
  cancelDeletion: string;
  deleteGym: string;
  deleteGymTitle: string;
  deleteGymHint: string;
  deleteOrg: string;
  deleteOrgTitle: string;
  deleteOrgHint: string;
  dangerTitle: string;
  dangerHint: string;
  confirmName: string;
  confirmNamePlaceholder: string;
  confirmDelete: string;
  cancel: string;
  close: string;
  save: string;
  upgrade: string;
  current: string;
  checkoutComingSoon: string;
  createGymComingSoon: string;
  retentionNote: string;
  planFreemium: string;
  planStarter: string;
  planGrowth: string;
  planPro: string;
  priceFree: string;
  pricePerOrg: string;
  pricePerGym: string;
  perMonth: string;
  gymQuota: string;
};

type Props = {
  locale: Locale;
  organizationName: string;
  planTier: OrgPlanTier;
  gyms: OrgGymRow[];
  labels: OrganizationLabels;
};

function planLabel(tier: OrgPlanTier, labels: OrganizationLabels) {
  switch (tier) {
    case "STARTER":
      return labels.planStarter;
    case "GROWTH":
      return labels.planGrowth;
    case "PRO":
      return labels.planPro;
    default:
      return labels.planFreemium;
  }
}

function priceLine(
  tier: OrgPlanTier,
  labels: OrganizationLabels,
): { amount: string; note: string } {
  const plan = AMRAP_PLANS.find((p) => p.tier === tier)!;
  if (plan.priceNote === "free") {
    return { amount: labels.priceFree, note: labels.perMonth };
  }
  const amount = `$${plan.priceMxnMonthly}`;
  const note =
    plan.priceNote === "per_org"
      ? `${labels.perMonth} · ${labels.pricePerOrg}`
      : `${labels.perMonth} · ${labels.pricePerGym}`;
  return { amount, note };
}

function retentionDate(iso: string, locale: Locale) {
  const base = new Date(iso);
  base.setDate(base.getDate() + ORG_DELETION_RETENTION_DAYS);
  try {
    return base.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return base.toISOString().slice(0, 10);
  }
}

function Flash({ state }: { state: OrgActionState }) {
  if (!state?.message && !state?.error) return null;
  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${state.error
        ? "border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
        : "border-[var(--color-success)]/25 bg-[var(--color-success)]/10 text-[var(--color-success)]"
        }`}
      role="status"
    >
      {state.error ?? state.message}
    </p>
  );
}

export function OrganizationClient({
  locale,
  organizationName,
  planTier,
  gyms,
  labels,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteGym, setDeleteGym] = useState<OrgGymRow | null>(null);
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);

  const [checkoutState, checkoutAction, checkoutPending] = useActionState(
    requestSubscriptionCheckout,
    null as OrgActionState,
  );
  const [createState, createAction, createPending] = useActionState(
    requestCreateGym,
    null as OrgActionState,
  );
  const [gymDeleteState, gymDeleteAction, gymDeletePending] = useActionState(
    scheduleGymDeletion,
    null as OrgActionState,
  );
  const [gymCancelState, gymCancelAction, gymCancelPending] = useActionState(
    cancelGymDeletion,
    null as OrgActionState,
  );
  const [orgDeleteState, orgDeleteAction, orgDeletePending] = useActionState(
    scheduleOrganizationDeletion,
    null as OrgActionState,
  );

  const activeGymCount = gyms.filter((g) => !g.deleted_at).length;
  const gymCap = maxGyms(planTier);
  const canAddGym = canCreateGym(planTier, activeGymCount);
  const needsUpgradeForGym = !canAddGym;

  const [prevCreate, setPrevCreate] = useState(createState);
  if (createState !== prevCreate) {
    setPrevCreate(createState);
    if (createState?.success) setCreateOpen(false);
  }

  const [prevGymDelete, setPrevGymDelete] = useState(gymDeleteState);
  if (gymDeleteState !== prevGymDelete) {
    setPrevGymDelete(gymDeleteState);
    if (gymDeleteState?.success) setDeleteGym(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-title text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {labels.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {labels.subtitle}
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] shadow-sm">
          <Building2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          {organizationName}
          <span className="rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
            {planLabel(planTier, labels)}
          </span>
        </p>
      </header>

      <Flash state={checkoutState} />
      <Flash state={createState} />
      <Flash state={gymDeleteState} />
      <Flash state={gymCancelState} />
      <Flash state={orgDeleteState} />

      <section
        id="subscription"
        className="scroll-mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            <CreditCard className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-title text-xl font-bold text-[var(--color-text)]">
              {labels.subscriptionTitle}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text)]">
              {labels.currentPlan}:{" "}
              <span className="font-semibold">{planLabel(planTier, labels)}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {AMRAP_PLANS.map((plan) => {
            const isCurrent = plan.tier === planTier;
            const pricing = priceLine(plan.tier, labels);
            return (
              <article
                key={plan.tier}
                className={`flex flex-col rounded-xl border p-4 ${isCurrent
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)]"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-title text-base font-bold text-[var(--color-text)]">
                    {planLabel(plan.tier, labels)}
                  </h3>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]">
                      <Check className="h-3 w-3" aria-hidden />
                      {labels.current}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 font-title text-2xl font-bold text-[var(--color-text)]">
                  {pricing.amount}
                </p>
                <p className="text-xs text-[var(--color-muted)]">{pricing.note}</p>
                {plan.tier !== "FREEMIUM" && !isCurrent ? (
                  <form action={checkoutAction} className="mt-auto pt-4">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="tier" value={plan.tier} />
                    <Button
                      type="submit"
                      variant="primary"
                      className="mt-0 w-full shadow-sm"
                      disabled={checkoutPending}
                    >
                      {labels.upgrade}
                    </Button>
                  </form>
                ) : (
                  <div className="mt-auto pt-4" />
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="gyms"
        className="scroll-mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-title text-xl font-bold text-[var(--color-text)]">
              {labels.gymsTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {labels.gymsHint}
            </p>
            {gymCap != null ? (
              <p className="mt-2 text-xs font-medium text-[var(--color-muted)]">
                {labels.gymQuota
                  .replace("{used}", String(activeGymCount))
                  .replace("{max}", String(gymCap))}
              </p>
            ) : null}
          </div>
          {!needsUpgradeForGym && (
            <Button
              type="button"
              variant="primary"
              className="mt-0 inline-flex shrink-0 items-center gap-1.5 shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {labels.addGym}
            </Button>
          )}
        </div>

        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
          {gyms.map((gym) => (
            <li
              key={gym.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-text)]">
                  {gym.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {gym.isCurrent ? (
                    <span className="rounded-md bg-[var(--color-primary)]/15 px-2 py-0.5 font-medium text-[var(--color-primary)]">
                      {labels.currentGym}
                    </span>
                  ) : null}
                  {gym.deleted_at ? (
                    <span className="rounded-md bg-[var(--color-danger)]/10 px-2 py-0.5 font-medium text-[var(--color-danger)]">
                      {labels.scheduledDeletion.replace(
                        "{date}",
                        retentionDate(gym.deleted_at, locale),
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {gym.deleted_at ? (
                  <form action={gymCancelAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="gym_id" value={gym.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
                      disabled={gymCancelPending}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      {labels.cancelDeletion}
                    </Button>
                  </form>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                    onClick={() => setDeleteGym(gym)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {labels.deleteGym}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="danger"
        className="scroll-mt-6 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-surface)] p-5 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-title text-xl font-bold text-[var(--color-text)]">
              {labels.dangerTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {labels.dangerHint}
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {labels.retentionNote.replace(
                "{days}",
                String(ORG_DELETION_RETENTION_DAYS),
              )}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="rounded-lg border border-[var(--color-danger)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
          onClick={() => setDeleteOrgOpen(true)}
        >
          {labels.deleteOrg}
        </Button>
      </section>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={labels.addGymTitle}
        description={labels.addGymDescription}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        <form action={createAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <FormField label={labels.gymName}>
            <Input
              required
              name="name"
              maxLength={LIMITS.entityName}
              autoComplete="organization"
            />
          </FormField>
          <p className="text-sm text-[var(--color-muted)]">
            {labels.createGymComingSoon}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold"
              onClick={() => setCreateOpen(false)}
            >
              {labels.cancel}
            </Button>
            <Button type="submit" variant="primary" className="mt-0" disabled={createPending}>
              {labels.save}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={deleteGym != null}
        onOpenChange={(open) => {
          if (!open) setDeleteGym(null);
        }}
        title={labels.deleteGymTitle}
        description={labels.deleteGymHint}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        {deleteGym ? (
          <form action={gymDeleteAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="gym_id" value={deleteGym.id} />
            <FormField label={labels.confirmName}>
              <Input
                required
                name="confirm_name"
                maxLength={LIMITS.entityName}
                placeholder={labels.confirmNamePlaceholder.replace(
                  "{name}",
                  deleteGym.name,
                )}
                autoComplete="off"
              />
            </FormField>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold"
                onClick={() => setDeleteGym(null)}
              >
                {labels.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="mt-0 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]"
                disabled={gymDeletePending}
              >
                {labels.confirmDelete}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={deleteOrgOpen}
        onOpenChange={setDeleteOrgOpen}
        title={labels.deleteOrgTitle}
        description={labels.deleteOrgHint}
        closeLabel={labels.close}
        className="max-w-lg"
      >
        <form action={orgDeleteAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <FormField label={labels.confirmName}>
            <Input
              required
              name="confirm_name"
              maxLength={LIMITS.entityName}
              placeholder={labels.confirmNamePlaceholder.replace(
                "{name}",
                organizationName,
              )}
              autoComplete="off"
            />
          </FormField>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold"
              onClick={() => setDeleteOrgOpen(false)}
            >
              {labels.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="mt-0 bg-[var(--color-danger)] hover:bg-[var(--color-danger)]"
              disabled={orgDeletePending}
            >
              {labels.confirmDelete}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
