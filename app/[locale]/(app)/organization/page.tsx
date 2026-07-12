import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { OrganizationClient } from "@/components/organization-client";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_billing")) {
    return (
      <p className="text-[var(--color-muted)]">
        {getDictionary(locale).common.forbidden}
      </p>
    );
  }

  const d = getDictionary(locale);
  const supabase = await createClient();
  const { data: gymRows } = await supabase
    .from("gyms")
    .select("id, name, deleted_at, created_at")
    .eq("organization_id", workspace.organizationId)
    .order("created_at", { ascending: true });

  const gyms = (gymRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    deleted_at: g.deleted_at,
    isCurrent: g.id === workspace.gymId,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl">
      <OrganizationClient
        locale={locale}
        organizationName={workspace.organizationName || workspace.gymName}
        planTier={workspace.planTier}
        gyms={gyms}
        labels={{
          title: d.organization.title,
          subtitle: d.organization.subtitle,
          currentPlan: d.organization.currentPlan,
          subscriptionTitle: d.organization.subscriptionTitle,
          subscriptionHint: d.organization.subscriptionHint,
          gymsTitle: d.organization.gymsTitle,
          gymsHint: d.organization.gymsHint,
          addGym: d.organization.addGym,
          addGymTitle: d.organization.addGymTitle,
          addGymDescription: d.organization.addGymDescription,
          gymName: d.organization.gymName,
          currentGym: d.organization.currentGym,
          scheduledDeletion: d.organization.scheduledDeletion,
          cancelDeletion: d.organization.cancelDeletion,
          deleteGym: d.organization.deleteGym,
          deleteGymTitle: d.organization.deleteGymTitle,
          deleteGymHint: d.organization.deleteGymHint,
          deleteOrg: d.organization.deleteOrg,
          deleteOrgTitle: d.organization.deleteOrgTitle,
          deleteOrgHint: d.organization.deleteOrgHint,
          dangerTitle: d.organization.dangerTitle,
          dangerHint: d.organization.dangerHint,
          confirmName: d.organization.confirmName,
          confirmNamePlaceholder: d.organization.confirmNamePlaceholder,
          confirmDelete: d.organization.confirmDelete,
          cancel: d.organization.cancel,
          close: d.organization.close,
          save: d.organization.save,
          upgrade: d.organization.upgrade,
          current: d.organization.current,
          checkoutComingSoon: d.organization.checkoutComingSoon,
          createGymComingSoon: d.organization.createGymComingSoon,
          upgradeForMoreGyms: d.organization.upgradeForMoreGyms,
          retentionNote: d.organization.retentionNote,
          planFreemium: d.organization.planFreemium,
          planStarter: d.organization.planStarter,
          planGrowth: d.organization.planGrowth,
          planPro: d.organization.planPro,
          priceFree: d.organization.priceFree,
          pricePerOrg: d.organization.pricePerOrg,
          pricePerGym: d.organization.pricePerGym,
          perMonth: d.organization.perMonth,
          gymQuota: d.organization.gymQuota,
        }}
      />
    </div>
  );
}
