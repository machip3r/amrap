import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/session";
import { canInWorkspace } from "@/lib/auth/permissions";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadTeamMembers } from "@/lib/team/queries";
import { loadSessionsForWeek } from "@/lib/classes/queries";
import { startOfWeekMonday } from "@/lib/classes/types";
import { ClassesClient } from "@/components/classes-client";

export default async function ClassesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string; tab?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const d = getDictionary(locale);
  const sp = await searchParams;

  const workspace = await getWorkspace();
  if (!workspace) redirect(`/${locale}/login`);
  const canManage = canInWorkspace(workspace, "manage_classes");
  const canView =
    canManage || canInWorkspace(workspace, "checkin");
  if (!canView) {
    return (
      <p className="text-[var(--color-muted)]">{d.common.forbidden}</p>
    );
  }

  const initialView =
    sp.tab === "calendar" || sp.tab === "catalog"
      ? sp.tab
      : canManage
        ? "catalog"
        : "calendar";

  const weekStart = sp.week
    ? startOfWeekMonday(new Date(`${sp.week}T12:00:00`))
    : startOfWeekMonday(new Date());

  const supabase = await createClient();

  // Catalog does not need week sessions or sibling gyms — skip those queries.
  const loadCalendar = initialView === "calendar";
  const loadSiblingGyms = canManage;

  const [classResult, trainers, sessions, orgGymRows] = await Promise.all([
    supabase
      .from("classes")
      .select(
        "id, name, description, capacity, duration_minutes, tags, is_active, created_at, class_trainers(user_id)",
      )
      .eq("gym_id", workspace.gymId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),
    loadTeamMembers(supabase, workspace.gymId, "TRAINER"),
    loadCalendar
      ? loadSessionsForWeek(supabase, workspace.gymId, weekStart)
      : Promise.resolve([]),
    loadSiblingGyms
      ? supabase
          .from("gyms")
          .select("id, name")
          .eq("organization_id", workspace.organizationId)
          .is("deleted_at", null)
          .order("name")
          .then((r) => r.data ?? [])
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  if (classResult.error) {
    console.error("classes page", classResult.error.message);
  }

  const trainerNameByUserId = new Map(
    trainers.map((t) => [t.userId, t.name] as const),
  );

  const classes = (classResult.data ?? []).map((row) => {
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
      duration_minutes: (row.duration_minutes as number) ?? 60,
      tags: (row.tags as string[]) ?? [],
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
        sessions={sessions}
        weekStartIso={weekStart.toISOString()}
        orgGyms={orgGymRows.map((g) => ({
          id: g.id,
          name: g.name,
        }))}
        currentGymId={workspace.gymId}
        canManage={canManage}
        initialView={initialView}
        labels={d.classes}
      />
    </div>
  );
}
