import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CircleCheck,
  HandHeart,
  Lightbulb,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { CategoryIcon } from "@/components/store/category-icon";
import { Reveal } from "@/components/store/reveal";
import { SectionHeading } from "@/components/store/section-heading";
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
  const categories = (await getStoreCategories()).filter((c) => c._count.products > 0);
  const story = t.raw("story") as string[];

  const values = [
    { key: "advice", icon: Lightbulb },
    { key: "quality", icon: ShieldCheck },
    { key: "honesty", icon: ReceiptText },
    { key: "respect", icon: Users },
    { key: "after", icon: HandHeart },
  ] as const;
  const facts = [
    { key: "licence", icon: BadgeCheck, value: storeConfig.licenceNo },
    { key: "gstin", icon: ReceiptText, value: storeConfig.gstin },
    { key: "shop", icon: Store, value: t("shopShort") },
    { key: "phone", icon: Phone, value: `+91 ${storeConfig.phone}` },
  ] as const;
  const support = [
    { key: "before", icon: Lightbulb },
    { key: "during", icon: ShoppingBag },
    { key: "after", icon: PackageCheck },
  ] as const;

  return (
    <>
      {/* Hero — real photo, dark overlay, centred message */}
      <section className="bg-brand-900 relative isolate overflow-hidden text-white">
        <Image
          src="/images/about/farmers-field.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-ken-burns -z-20 object-cover object-[center_40%]"
        />
        <div
          className="from-brand-900/85 via-brand-900/70 to-brand-900/95 absolute inset-0 -z-10 bg-gradient-to-b"
          aria-hidden
        />
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-32 text-center sm:pt-20 sm:pb-36">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <MapPin className="text-accent-400 size-4" aria-hidden /> {t("badge")}
          </p>
          <h1 className="animate-fade-up mt-5 text-4xl leading-tight font-bold tracking-tight text-balance [animation-delay:80ms] sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="animate-fade-up text-brand-100 mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty [animation-delay:160ms]">
            {t("heroText")}
          </p>
          <p className="animate-fade-up text-accent-300 mt-5 font-semibold [animation-delay:220ms]">
            {t("promise")}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3 [animation-delay:280ms]">
            <Button
              asChild
              variant="accent"
              size="lg"
              className="h-12 px-6 text-base shadow-lg transition hover:-translate-y-0.5"
            >
              <a href={`tel:+91${storeConfig.phone}`}>
                <Phone /> {t("heroCall")}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover:text-brand-800 h-12 border-white/70 bg-white/5 px-6 text-base text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <MapPin /> {t("heroVisit")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Key facts on the hero edge */}
      <div className="relative z-10 mx-auto -mt-20 max-w-5xl px-4">
        <dl className="animate-fade-up bg-border grid grid-cols-2 gap-px overflow-hidden rounded-2xl text-center shadow-xl ring-1 ring-black/5 [animation-delay:360ms] md:grid-cols-4">
          {facts.map(({ key, icon: Icon, value }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-1 bg-white p-4 sm:p-5"
            >
              <Icon className="text-brand-600 size-6" aria-hidden />
              <dt className="text-muted-foreground mt-1 text-xs font-medium tracking-wide uppercase">
                {t(`facts.${key}`)}
              </dt>
              <dd className="text-brand-800 text-sm font-bold break-all sm:text-base">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Story */}
      <Reveal as="section" className="mx-auto max-w-5xl px-4 py-16">
        <SectionHeading title={t("storyTitle")} />
        <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
          <div className="rounded-card relative aspect-[3/2] overflow-hidden shadow-md">
            <Image
              src="/images/about/farmer-at-work.jpg"
              alt={t("photoAlt.advice")}
              fill
              sizes="(min-width: 768px) 480px, 100vw"
              className="object-cover transition duration-700 hover:scale-105"
            />
          </div>
          <div className="space-y-4 text-center text-pretty">
            {story.map((p) => (
              <p key={p.slice(0, 24)} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Values */}
      <section className="bg-brand-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <Reveal>
            <SectionHeading title={t("valuesTitle")} tone="light" />
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {values.map(({ key, icon: Icon }, i) => (
              <Reveal
                as="li"
                key={key}
                delay={i * 80}
                className="group rounded-card flex flex-col items-center bg-white/10 p-5 text-center transition duration-300 hover:-translate-y-1 hover:bg-white/15"
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

      {/* How we help — before, during, after */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal>
          <SectionHeading title={t("supportTitle")} />
        </Reveal>
        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-5">
          {support.map(({ key, icon: Icon }, i) => (
            <Reveal
              as="li"
              key={key}
              delay={i * 100}
              className="group rounded-card relative flex flex-col items-center bg-white p-6 text-center shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="bg-brand-700 absolute -top-4 flex size-8 items-center justify-center rounded-full text-sm font-bold text-white shadow">
                {i + 1}
              </span>
              <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 mt-2 flex size-14 items-center justify-center rounded-full transition-colors duration-300 group-hover:text-white">
                <Icon className="size-7" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(`support.${key}.title`)}</h3>
              <ul className="mt-3 space-y-2">
                {(t.raw(`support.${key}.items`) as string[]).map((item) => (
                  <li key={item} className="text-muted-foreground text-sm">
                    <CircleCheck className="text-brand-600 mr-1 inline size-4 align-[-2px]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* What we sell */}
      {categories.length > 0 && (
        <Reveal as="section" className="bg-brand-50">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <SectionHeading title={t("sellTitle")} text={t("sellText")} />
            <ul className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
              {categories.map((c) => (
                <li key={c.id} className="w-40">
                  <Link
                    href={listingHref({ category: c.slug })}
                    className="group rounded-card flex h-full flex-col items-center gap-2 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
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

      {/* Visit */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <Reveal className="rounded-card from-brand-700 to-brand-600 flex flex-col items-center justify-center bg-gradient-to-br p-6 text-center text-white shadow-md">
          <h2 className="text-xl font-semibold">{t("visitTitle")}</h2>
          <p className="text-brand-100 mt-2">{t("visitText")}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm">
            <MapPin className="text-accent-300 size-4 shrink-0" aria-hidden /> {storeConfig.addressHi}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" className="transition hover:-translate-y-0.5">
              <a href={`tel:+91${storeConfig.phone}`}>
                <Phone /> +91 {storeConfig.phone}
              </a>
            </Button>
            <Button
              asChild
              className="bg-whatsapp text-white transition hover:-translate-y-0.5 hover:brightness-95"
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
