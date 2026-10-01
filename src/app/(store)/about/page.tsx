import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-brand-800 text-3xl font-bold">{t("title")}</h1>
      <p className="mt-6 text-lg">{t("body")}</p>
      <p className="rounded-card bg-brand-50 text-brand-800 mt-6 px-5 py-4 text-lg font-semibold">
        {t("promise")}
      </p>
      <p className="text-muted-foreground mt-6">{storeConfig.addressHi}</p>
    </div>
  );
}
