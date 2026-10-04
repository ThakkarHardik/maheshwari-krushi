import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  HandHelping,
  IndianRupee,
  Leaf,
  MessageCircle,
  MousePointerClick,
  Phone,
  ReceiptText,
  ShoppingCart,
  Sprout,
  Truck,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { CategoryIcon } from "@/components/store/category-icon";
import { Faq } from "@/components/store/faq";
import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/store/reveal";
import { TrustStrip } from "@/components/store/trust-strip";
import { Button } from "@/components/ui/button";
import { storeConfig } from "@/config/store";
import { listingHref } from "@/lib/catalog/listing";
import { getFeaturedProducts, getStoreCategories, getStoreCrops } from "@/lib/catalog/queries";
import { localized } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const [featured, categories, crops] = await Promise.all([
    getFeaturedProducts(locale, 8),
    getStoreCategories().then((all) => all.filter((c) => c._count.products > 0)),
    getStoreCrops(),
  ]);
  const whatsappAdvice = buildWhatsAppLink(storeConfig.whatsapp, t("ctaMessage"));

  const highlights = [
    { icon: BadgeCheck, label: t("highlights.licensed") },
    { icon: ReceiptText, label: t("highlights.bill") },
    { icon: IndianRupee, label: t("highlights.cod") },
    { icon: Truck, label: t("highlights.local") },
  ];
  const steps = [
    { icon: MousePointerClick, key: "1" },
    { icon: ShoppingCart, key: "2" },
    { icon: ReceiptText, key: "3" },
    { icon: Truck, key: "4" },
  ] as const;
  const reasons = [
    { icon: Sprout, key: "advice" },
    { icon: BadgeCheck, key: "genuine" },
    { icon: IndianRupee, key: "price" },
    { icon: HandHelping, key: "support" },
  ] as const;

  return (
    <>
      {/* Hero */}
      <section className="from-brand-800 via-brand-700 to-brand-600 relative overflow-hidden bg-gradient-to-br text-white">
        <Leaf className="animate-float text-brand-500/40 absolute top-10 right-[8%] size-24" aria-hidden />
        <Sprout
          className="animate-float-slow text-brand-500/30 absolute right-[28%] bottom-8 size-20"
          aria-hidden
        />
        <Leaf
          className="animate-float-slow text-brand-500/25 absolute top-1/2 right-[3%] size-14 rotate-45"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            <Leaf className="size-4" aria-hidden /> {t("heroBadge")}
          </p>
          <h1 className="animate-fade-up mt-4 max-w-2xl text-4xl leading-tight font-bold [animation-delay:80ms] sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="animate-fade-up text-accent-300 mt-3 text-lg font-semibold [animation-delay:160ms] sm:text-xl">
            {t("heroTagline")}
          </p>
          <p className="animate-fade-up text-brand-100 mt-3 max-w-xl text-base [animation-delay:220ms] sm:text-lg">
            {t("heroText")}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:300ms]">
            <Button
              asChild
              variant="accent"
              size="lg"
              className="shadow-lg transition hover:-translate-y-0.5"
            >
              <Link href="/products">
                {t("shopNow")} <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover:text-brand-800 border-white bg-transparent text-white transition hover:-translate-y-0.5 hover:bg-white"
            >
              <a href={whatsappAdvice} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {t("askAdvice")}
              </a>
            </Button>
          </div>
          <ul className="animate-fade-up mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-2 text-sm [animation-delay:380ms] sm:grid-cols-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="text-accent-300 size-4 shrink-0" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-border bg-brand-50 border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <TrustStrip />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-14">
          <SectionTitle title={t("categoriesTitle")} text={t("categoriesText")} />
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={listingHref({ category: c.slug })}
                  className="group border-border rounded-card hover:border-brand-600 flex h-full flex-col items-center gap-3 border bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 flex size-16 items-center justify-center rounded-full transition-colors duration-300 group-hover:text-white">
                    <CategoryIcon
                      slug={c.slug}
                      className="size-8 transition-transform duration-300 group-hover:scale-110"
                    />
                  </span>
                  <span className="text-lg font-semibold">{localized(c.nameHi, c.nameEn, locale)}</span>
                  <span className="text-muted-foreground text-sm">
                    {t("productCount", { count: c._count.products })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-14">
          <SectionTitle id="featured-heading" title={t("featuredTitle")} text={t("featuredText")} />
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((product, i) => (
              <li key={product.slug}>
                <ProductCard product={product} priority={i < 2} />
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="transition hover:-translate-y-0.5">
              <Link href="/products">
                {t("viewAll")} <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
      )}

      {/* Shop by crop */}
      {crops.length > 0 && (
        <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-14">
          <SectionTitle title={t("cropsTitle")} text={t("cropsText")} />
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {crops.map((crop) => (
              <li key={crop.slug}>
                <Link
                  href={listingHref({ crop: crop.slug })}
                  className="group border-border hover:border-brand-700 hover:bg-brand-700 flex items-center gap-2 rounded-full border bg-white py-2 pr-4 pl-2 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:text-white hover:shadow-md"
                >
                  <span className="bg-brand-50 text-brand-700 flex size-9 items-center justify-center rounded-full transition group-hover:bg-white/20 group-hover:text-white">
                    <Sprout className="size-5" aria-hidden />
                  </span>
                  <span className="font-semibold">{localized(crop.nameHi, crop.nameEn, locale)}</span>
                  <span className="text-muted-foreground text-xs group-hover:text-white/80">
                    {crop.seasons.map((s) => t(`seasons.${s}`)).join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* How to order */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle title={t("stepsTitle")} text={t("stepsText")} />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, key }, i) => (
            <li
              key={key}
              className="border-border rounded-card relative flex flex-col gap-3 border bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="bg-accent-400 text-brand-900 absolute -top-3 left-5 flex size-7 items-center justify-center rounded-full text-sm font-bold shadow">
                {i + 1}
              </span>
              <Icon className="text-brand-600 mt-2 size-8" aria-hidden />
              <h3 className="text-lg font-semibold">{t(`steps.${key}.title`)}</h3>
              <p className="text-muted-foreground text-sm">{t(`steps.${key}.text`)}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* Why us */}
      <Reveal as="section" className="bg-brand-50 mt-16">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <SectionTitle title={t("whyTitle")} />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, key }) => (
              <li
                key={key}
                className="group rounded-card flex flex-col gap-3 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 flex size-12 items-center justify-center rounded-xl transition-colors duration-300 group-hover:text-white">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">{t(`why.${key}.title`)}</h3>
                <p className="text-muted-foreground text-sm">{t(`why.${key}.text`)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <Link
              href="/about"
              className="text-brand-700 inline-flex items-center gap-1 font-semibold hover:underline"
            >
              {t("whyMore")} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </p>
        </div>
      </Reveal>

      {/* FAQ */}
      <Reveal as="section" className="mx-auto max-w-3xl px-4 pt-14">
        <SectionTitle title={t("faqTitle")} />
        <div className="mt-8">
          <Faq keys={["delivery", "payment", "genuine", "damaged"]} />
        </div>
        <p className="mt-4 text-center">
          <Link href="/contact" className="text-brand-700 font-semibold hover:underline">
            {t("faqMore")} →
          </Link>
        </p>
      </Reveal>

      {/* Advice CTA */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-14">
        <div className="rounded-card from-accent-300 to-accent-400 text-brand-900 flex flex-col items-start gap-4 bg-gradient-to-r p-6 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-2xl font-bold">{t("ctaTitle")}</h2>
            <p className="mt-1">{t("ctaText")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="transition hover:-translate-y-0.5">
              <a href={`tel:+91${storeConfig.phone}`}>
                <Phone /> {t("ctaCall")}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand-800 transition hover:-translate-y-0.5"
            >
              <a href={whatsappAdvice} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {t("ctaWhatsapp")}
              </a>
            </Button>
          </div>
        </div>
      </Reveal>
    </>
  );
}

function SectionTitle({ title, text, id }: { title: string; text?: string; id?: string }) {
  return (
    <div className="text-center">
      <h2 id={id} className="text-brand-800 text-2xl font-bold sm:text-3xl">
        {title}
      </h2>
      <span className="bg-accent-400 mx-auto mt-3 block h-1 w-16 rounded-full" aria-hidden />
      {text && (
        <p className="text-muted-foreground mx-auto mt-3 flex max-w-xl items-center justify-center gap-1">
          <CircleCheck className="text-brand-600 size-4 shrink-0" aria-hidden />
          {text}
        </p>
      )}
    </div>
  );
}
