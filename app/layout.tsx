import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

/** Headings — https://fonts.google.com/specimen/Space+Grotesk */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

/** Body, subtitles, UI — https://fonts.google.com/specimen/Plus+Jakarta+Sans */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "AMRAP",
    template: "%s | AMRAP",
  },
  description: "Spaces Control",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { headers } = await import("next/headers");
  const locale = (await headers()).get("x-locale") ?? "es";

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${plusJakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
