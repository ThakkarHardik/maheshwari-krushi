import type { Metadata, Viewport } from "next";
import { Mukta } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: `%s | ${t("title")}` },
    description: t("description"),
  };
}

export const viewport: Viewport = {
  themeColor: "#1b5e20",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={mukta.variable}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
