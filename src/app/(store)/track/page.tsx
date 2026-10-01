import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";
import { TrackForm } from "./track-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("track");
  return { title: t("title"), robots: { index: false } };
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const t = await getTranslations("track");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-brand-800 text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2 mb-6">{t("intro")}</p>
      <TrackForm
        whatsapp={storeConfig.whatsapp}
        defaultOrderNumber={order && /^[A-Za-z0-9#]{4,20}$/.test(order) ? order : undefined}
      />
    </div>
  );
}
