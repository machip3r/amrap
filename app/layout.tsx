import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym membership",
  description: "Multi-tenant gym membership control",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { headers } = await import("next/headers");
  const locale = (await headers()).get("x-locale") ?? "es";

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
