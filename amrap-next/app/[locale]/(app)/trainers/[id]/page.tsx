import { TeamMemberDetailPage } from "@/components/team-member-detail";

export default async function TrainerDetailRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return (
    <TeamMemberDetailPage locale={locale} id={id} listRole="trainer" />
  );
}
