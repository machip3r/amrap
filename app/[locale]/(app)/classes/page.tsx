import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadTeamMembers } from "@/lib/team/queries";
import { ClassesClient } from "@/components/classes-client";

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  if (!canInWorkspace(workspace, "manage_classes")) {
    return (
      <p className="text-[var(--color-muted)]">{d.common.forbidden}</p>
    );
  }

  const supabase = await createClient();
  const [{ data: classRows }, trainers] = await Promise.all([
    supabase
      .from("classes")
      .select(
        "id, name, description, capacity, is_active, created_at, class_trainers(user_id)",
      )
      .eq("gym_id", workspace.gymId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    loadTeamMembers(supabase, workspace.gymId, "TRAINER"),
  ]);

  const trainerNameByUserId = new Map(
    trainers.map((t) => [t.userId, t.name] as const),
  );

  const classes = (classRows ?? []).map((row) => {
    const links = Array.isArray(row.class_trainers)
      ? row.class_trainers
      : row.class_trainers
        ? [row.class_trainers]
        : [];
    const trainerIds = links
      .map((l) => (l as { user_id: string }).user_id)
      .filter(Boolean);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      is_active: row.is_active,
      trainerIds,
      trainerNames: trainerIds.map(
        (id) => trainerNameByUserId.get(id) ?? id.slice(0, 8),
      ),
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <ClassesClient
        locale={locale}
        classes={classes}
        trainers={trainers.map((t) => ({
          userId: t.userId,
          name: t.name,
        }))}
        labels={{
          subtitle: d.classes.subtitle,
          newClass: d.classes.newClass,
          className: d.classes.className,
          description: d.classes.description,
          descriptionHint: d.classes.descriptionHint,
          capacity: d.classes.capacity,
          capacityHint: d.classes.capacityHint,
          trainers: d.classes.trainers,
          trainersHint: d.classes.trainersHint,
          noTrainers: d.classes.noTrainers,
          save: d.classes.save,
          cancel: d.classes.cancel,
          close: d.classes.close,
          edit: d.classes.edit,
          archive: d.classes.archive,
          restore: d.classes.restore,
          active: d.classes.active,
          archived: d.classes.archived,
          noClasses: d.classes.noClasses,
          createTitle: d.classes.createTitle,
          createDescription: d.classes.createDescription,
          editTitle: d.classes.editTitle,
          editDescription: d.classes.editDescription,
          unlimited: d.classes.unlimited,
          trainerCount: d.classes.trainerCount,
        }}
      />
    </div>
  );
}
