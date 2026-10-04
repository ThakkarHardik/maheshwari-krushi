import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  IndianRupee,
  Leaf,
  MessageCircle,
  MousePointerClick,
  Phone,
  ReceiptText,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { HeroScene } from "@/components/store/hero-scene";
import { ProductImage } from "@/components/store/product-image";
import { Reveal } from "@/components/store/reveal";
import { SectionHeading } from "@/components/store/section-heading";
import { Stars } from "@/components/store/stars";
import { Button } from "@/components/ui/button";
import { storeConfig } from "@/config/store";
import { toPanelVariants } from "@/lib/catalog/panel";
import { getSpotlightProduct } from "@/lib/catalog/queries";
import { summarize } from "@/lib/catalog/summary";
import { localized, localizedList } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { PurchasePanel } from "./products/[slug]/purchase-panel";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tp = await getTranslations("product");
  const locale = await getLocale();
  const { product, otherProducts } = await getSpotlightProduct();
  const whatsappAdvice = buildWhatsAppLink(storeConfig.whatsapp, t("ctaMessage"));

  const name = product ? localized(product.nameHi, product.nameEn, locale) : "";
  const subLabel = product ? localized(product.subLabelHi, product.subLabelEn, locale) : null;
  const description = product ? localized(product.descriptionHi, product.descriptionEn, locale) : null;
  const benefits = product ? localizedList(product.benefitsHi, product.benefitsEn, locale).slice(0, 4) : [];
  const rating = product?.ratingAvg.toNumber() ?? 0;

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

  return (
    <>
      {/* Hero — centred, with the animated field scene and the product */}
      <section className="from-brand-800 via-brand-700 to-brand-600 relative overflow-hidden bg-gradient-to-b text-white">
        <Leaf
          className="animate-float text-brand-500/30 absolute top-16 left-[6%] hidden size-16 sm:block"
          aria-hidden
        />
        <Leaf
          className="animate-float-slow text-brand-500/30 absolute top-24 right-[7%] hidden size-20 rotate-90 sm:block"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-10 text-center sm:pt-14">
          <p className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
            <Leaf className="size-4" aria-hidden /> {t("heroBadge")}
          </p>
          <h1 className="animate-fade-up mx-auto mt-4 max-w-3xl text-4xl leading-tight font-bold text-balance [animation-delay:80ms] sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="animate-fade-up text-accent-300 mt-3 text-lg font-semibold [animation-delay:160ms] sm:text-xl">
            {t("heroTagline")}
          </p>
          <p className="animate-fade-up text-brand-100 mx-auto mt-3 max-w-xl text-pretty [animation-delay:220ms] sm:text-lg">
            {t("heroText")}
          </p>
          <div className="animate-fade-up mt-7 flex flex-wrap justify-center gap-3 [animation-delay:300ms]">
            <Button
              asChild
              variant="accent"
              size="lg"
              className="shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <a href={product ? "#product" : "/products"}>
                {t("shopNow")} <ArrowRight />
              </a>
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
          <div className="animate-fade-up mt-8 [animation-delay:380ms]">
            <HeroScene imageUrl={product?.images[0]?.url ?? null} alt={name || t("heroTitle")} />
          </div>
        </div>
      </section>

      {/* Highlights bar overlapping the hero edge */}
      <div className="relative z-10 mx-auto -mt-8 max-w-5xl px-4">
        <ul className="rounded-card grid grid-cols-2 gap-x-4 gap-y-3 bg-white px-4 py-4 shadow-lg ring-1 ring-black/5 sm:grid-cols-4 sm:px-6">
          {highlights.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1 text-center text-sm font-medium sm:flex-row sm:justify-center sm:gap-2"
            >
              <span className="bg-brand-50 text-brand-700 flex size-9 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-5" aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* The product — buy straight from the home page */}
      {product && (
        <section id="product" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-14">
          <Reveal>
            <SectionHeading title={t("spotlightTitle")} text={t("spotlightText")} />
            <div className="rounded-card mt-8 grid items-center gap-8 bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8 md:grid-cols-2">
              <div className="text-center">
                <ProductImage
                  src={product.images[0]?.url}
                  alt={name}
                  sizes="(min-width: 768px) 420px, 100vw"
                  placeholderLabel={tp("noImage")}
                  className="rounded-card mx-auto max-w-56 sm:max-w-xs"
                />
                <h3 className="text-brand-800 mt-5 text-2xl font-bold">
                  {name}{" "}
                  {subLabel && <span className="text-muted-foreground text-lg font-medium">{subLabel}</span>}
                </h3>
                {product.ratingCount > 0 && (
                  <p className="mt-2 flex items-center justify-center gap-2 text-sm">
                    <Stars rating={rating} label={tp("rating", { rating: rating.toFixed(1) })} />
                    <span className="text-muted-foreground">
                      {tp("reviews", { count: product.ratingCount })}
                    </span>
                  </p>
                )}
                {description && (
                  <p className="text-muted-foreground mx-auto mt-3 max-w-md text-pretty">
                    {summarize(description)}
                  </p>
                )}
                {benefits.length > 0 && (
                  <ul className="mt-4 flex flex-wrap justify-center gap-2">
                    {benefits.map((b) => (
                      <li
                        key={b}
                        className="bg-brand-50 text-brand-800 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                      >
                        <CircleCheck className="text-brand-600 size-4" aria-hidden /> {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="md:border-border md:border-l md:pl-8">
                <PurchasePanel
                  productId={product.id}
                  productName={name}
                  variants={toPanelVariants(product.variants)}
                  whatsapp={storeConfig.whatsapp}
                />
                <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-brand-700 inline-flex items-center gap-1 hover:underline"
                  >
                    {t("fullDetails")} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  {otherProducts > 0 && (
                    <Link
                      href="/products"
                      className="text-brand-700 inline-flex items-center gap-1 hover:underline"
                    >
                      {t("moreProducts")} ({otherProducts}) <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* How to order — one compact row */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-14">
        <SectionHeading title={t("stepsTitle")} text={t("stepsText")} />
        <ol className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {steps.map(({ icon: Icon, key }, i) => (
            <li
              key={key}
              className="group rounded-card flex flex-col items-center gap-2 bg-white p-5 text-center shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 relative flex size-14 items-center justify-center rounded-full transition-colors duration-300 group-hover:text-white">
                <Icon className="size-7" aria-hidden />
                <span className="bg-accent-400 text-brand-900 absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
              </span>
              <h3 className="font-semibold">{t(`steps.${key}.title`)}</h3>
              <p className="text-muted-foreground text-sm">{t(`steps.${key}.text`)}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* Advice banner */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-14">
        <div className="rounded-card from-brand-800 to-brand-600 relative overflow-hidden bg-gradient-to-r px-6 py-10 text-center text-white shadow-lg">
          <MessageCircle
            className="animate-float-slow absolute -bottom-6 -left-6 size-32 text-white/10"
            aria-hidden
          />
          <h2 className="relative text-2xl font-bold text-balance sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="text-brand-100 relative mx-auto mt-2 max-w-xl text-pretty">{t("ctaText")}</p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="accent" className="transition hover:-translate-y-0.5">
              <a href={`tel:+91${storeConfig.phone}`}>
                <Phone /> {t("ctaCall")}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-whatsapp text-white transition hover:-translate-y-0.5 hover:brightness-95"
            >
              <a href={whatsappAdvice} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {t("ctaWhatsapp")}
              </a>
            </Button>
          </div>
          <p className="relative mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
            <Link href="/contact#faq" className="text-brand-100 hover:text-white hover:underline">
              {t("helpLinks")} →
            </Link>
            <Link href="/about" className="text-brand-100 hover:text-white hover:underline">
              {t("whyMore")} →
            </Link>
          </p>
        </div>
      </Reveal>
    </>
  );
}
