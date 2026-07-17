import { notFound } from "next/navigation";
import { getMemberContext } from "@/lib/auth/member-session";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import { MemberQrClient } from "@/components/member-qr-client";

export default async function MemberQrPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const member = await getMemberContext();
  if (!member) notFound();

  return (
    <MemberQrClient
      locale={locale}
      qrCode={member.qrCode}
      name={member.fullName}
    />
  );
}
