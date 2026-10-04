import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CircleCheck,
  HandHeart,
  Lightbulb,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AboutPhoto } from "@/components/store/about-photo";
import { CategoryIcon } from "@/components/store/category-icon";
import { Reveal } from "@/components/store/reveal";
import { Button } from "@/components/ui/button";
import { MAPS_URL, storeConfig } from "@/config/store";
import { listingHref } from "@/lib/catalog/listing";
import { getStoreCategories } from "@/lib/catalog/queries";
import { localized } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("title"), description: t("heroText") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tWa = await getTranslations("whatsapp");
  const locale = await getLocale();
  const categories = await getStoreCategories().then((all) => all.filter((c) => c._count.products > 0));
  const story = t.raw("story") as string[];

  const values = [
    { key: "advice", icon: Lightbulb },
    { key: "quality", icon: ShieldCheck },
    { key: "honesty", icon: ReceiptText },
    { key: "respect", icon: Users },
    { key: "after", icon: HandHeart },
  ] as const;
  const support = ["before", "during", "after"] as const;

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-50 border-border border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-brand-700 animate-fade-up inline-flex items-center gap-1 text-sm font-semibold">
              <MapPin className="size-4" aria-hidden /> {t("badge")}
            </p>
            <h1 className="text-brand-800 animate-fade-up mt-2 text-3xl leading-tight font-bold [animation-delay:80ms] sm:text-4xl">
              {t("heroTitle")}
            </h1>
            <p className="animate-fade-up mt-4 text-lg leading-relaxed [animation-delay:160ms]">
              {t("heroText")}
            </p>
            <p className="bg-accent-300/60 text-brand-900 animate-fade-up mt-6 inline-block rounded-md px-4 py-2 font-semibold [animation-delay:240ms]">
              {t("promise")}
            </p>
          </div>
          <div className="animate-scale-in [animation-delay:200ms]">
            <AboutPhoto name="field" alt={t("photoAlt.field")} />
          </div>
        </div>
      </section>

      {/* Story */}
      <Reveal as="section" className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2">
        <AboutPhoto name="shop" alt={t("photoAlt.shop")} className="order-last md:order-first" />
        <div>
          <h2 className="text-brand-800 text-2xl font-bold sm:text-3xl">{t("storyTitle")}</h2>
          <span className="bg-accent-400 mt-3 block h-1 w-16 rounded-full" aria-hidden />
          {story.map((p) => (
            <p key={p.slice(0, 24)} className="mt-4 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </Reveal>

      {/* Values */}
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Reveal>
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("valuesTitle")}</h2>
            <span className="bg-accent-400 mx-auto mt-3 block h-1 w-16 rounded-full" aria-hidden />
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {values.map(({ key, icon: Icon }, i) => (
              <Reveal
                as="li"
                key={key}
                delay={i * 80}
                className="group rounded-card bg-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <span className="bg-accent-400 text-brand-900 flex size-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{t(`values.${key}.title`)}</h3>
                <p className="text-brand-100 mt-2 text-sm leading-relaxed">{t(`values.${key}.text`)}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* How we help */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal className="grid items-center gap-8 md:grid-cols-[1fr_1.4fr]">
          <AboutPhoto name="advice" alt={t("photoAlt.advice")} />
          <div>
            <h2 className="text-brand-800 text-2xl font-bold sm:text-3xl">{t("supportTitle")}</h2>
            <span className="bg-accent-400 mt-3 block h-1 w-16 rounded-full" aria-hidden />
            <ol className="mt-6 space-y-5">
              {support.map((key, i) => (
                <li key={key} className="flex gap-4">
                  <span className="bg-brand-700 flex size-9 shrink-0 items-center justify-center rounded-full font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(`support.${key}.title`)}</h3>
                    <ul className="mt-1 space-y-1">
                      {(t.raw(`support.${key}.items`) as string[]).map((item) => (
                        <li key={item} className="text-muted-foreground flex gap-2 text-sm">
                          <CircleCheck className="text-brand-600 mt-0.5 size-4 shrink-0" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* What we sell */}
      {categories.length > 0 && (
        <Reveal as="section" className="bg-brand-50">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center">
            <h2 className="text-brand-800 text-2xl font-bold sm:text-3xl">{t("sellTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("sellText")}</p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={listingHref({ category: c.slug })}
                    className="group rounded-card flex h-full flex-col items-center gap-2 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <CategoryIcon
                      slug={c.slug}
                      className="text-brand-600 size-9 transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="font-semibold">{localized(c.nameHi, c.nameEn, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}

      {/* Trust + visit */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-2">
        <Reveal className="border-border rounded-card border bg-white p-6 shadow-sm">
          <h2 className="text-brand-800 flex items-center gap-2 text-xl font-semibold">
            <BadgeCheck className="size-6" aria-hidden /> {t("trustTitle")}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("licence")}</dt>
              <dd className="font-semibold">{storeConfig.licenceNo}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("gstin")}</dt>
              <dd className="font-semibold">{storeConfig.gstin}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("address")}</dt>
              <dd className="text-right font-semibold">{storeConfig.addressHi}</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal
          delay={100}
          className="rounded-card from-brand-700 to-brand-600 bg-gradient-to-br p-6 text-white shadow-md"
        >
          <h2 className="text-xl font-semibold">{t("visitTitle")}</h2>
          <p className="text-brand-100 mt-2">{t("visitText")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="accent" className="transition hover:-translate-y-0.5">
              <a href={`tel:+91${storeConfig.phone}`}>
                <Phone /> +91 {storeConfig.phone}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hover:text-brand-800 border-white bg-transparent text-white transition hover:-translate-y-0.5 hover:bg-white"
            >
              <a
                href={buildWhatsAppLink(storeConfig.whatsapp, tWa("defaultMessage"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle /> WhatsApp
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hover:text-brand-800 border-white bg-transparent text-white transition hover:-translate-y-0.5 hover:bg-white"
            >
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <MapPin /> {t("directions")}
              </a>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
