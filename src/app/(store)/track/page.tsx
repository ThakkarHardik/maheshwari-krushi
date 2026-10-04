import type { Metadata } from "next";
import { SectionHeading } from "@/components/store/section-heading";
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
      <SectionHeading as="h1" title={t("title")} text={t("intro")} className="animate-fade-up mb-8" />
      <TrackForm
        whatsapp={storeConfig.whatsapp}
        defaultOrderNumber={order && /^[A-Za-z0-9#]{4,20}$/.test(order) ? order : undefined}
      />
    </div>
  );
}
