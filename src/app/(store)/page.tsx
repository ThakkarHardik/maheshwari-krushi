import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  MessageCircle,
  MousePointerClick,
  Phone,
  ReceiptText,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
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
  const photo = product?.images[0];

  const highlights = [
    t("highlights.licensed"),
    t("highlights.bill"),
    t("highlights.cod"),
    t("highlights.local"),
  ];
  const steps = [
    { icon: MousePointerClick, key: "1" },
    { icon: ShoppingCart, key: "2" },
    { icon: ReceiptText, key: "3" },
    { icon: Truck, key: "4" },
  ] as const;

  return (
    <>
      {/* Hero — real field photo, dark overlay, centred message */}
      <section className="bg-brand-900 relative isolate overflow-hidden text-white">
        <Image
          src="/images/hero/wheat-field.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-ken-burns -z-20 object-cover object-[center_65%]"
        />
        <div
          className="from-brand-900/85 via-brand-900/55 to-brand-900 absolute inset-0 -z-10 bg-gradient-to-b"
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-4 pt-14 pb-36 text-center sm:pt-20 sm:pb-44">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <BadgeCheck className="text-accent-400 size-4" aria-hidden /> {t("heroBadge")}
          </p>
          <h1 className="animate-fade-up mx-auto mt-5 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-balance [animation-delay:80ms] sm:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="animate-fade-up text-brand-100 mx-auto mt-5 max-w-2xl text-lg text-pretty [animation-delay:160ms] sm:text-xl">
            {t("heroText")}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <Button
              asChild
              variant="accent"
              size="lg"
              className="h-12 px-7 text-base shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <a href={product ? "#product" : "/products"}>
                {t("shopNow")} <ArrowRight />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="hover:text-brand-800 h-12 border-white/70 bg-white/5 px-7 text-base text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <a href={whatsappAdvice} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> {t("askAdvice")}
              </a>
            </Button>
          </div>
          <ul className="animate-fade-up text-brand-100 mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm [animation-delay:320ms] sm:text-base">
            {highlights.map((label) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <CircleCheck className="text-accent-400 size-4" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The product — sits on the hero edge, buy straight from here */}
      {product && (
        <section id="product" className="relative z-10 mx-auto -mt-24 max-w-5xl scroll-mt-24 px-4 sm:-mt-28">
          <div className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 [animation-delay:400ms] md:grid md:grid-cols-[5fr_6fr]">
            <div className="group bg-brand-50 relative aspect-[4/5] max-h-[28rem] w-full overflow-hidden md:aspect-auto md:max-h-none">
              {photo ? (
                <Image
                  src={photo.url}
                  alt={photo.alt ?? name}
                  fill
                  sizes="(min-width: 768px) 440px, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              ) : (
                <ProductImage
                  alt={name}
                  sizes="440px"
                  placeholderLabel={tp("noImage")}
                  className="size-full"
                />
              )}
            </div>
            <div className="p-6 text-center sm:p-8">
              <h2 className="bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase">
                <span className="bg-brand-600 size-2 animate-pulse rounded-full" aria-hidden />
                {t("spotlightTitle")}
              </h2>
              <h3 className="text-brand-800 mt-3 text-2xl font-bold sm:text-3xl">
                {name}{" "}
                {subLabel && <span className="text-muted-foreground text-base font-medium">{subLabel}</span>}
              </h3>
              {product.ratingCount > 0 && (
                <p className="mt-2 flex items-center justify-center gap-2 text-sm">
                  <Stars rating={rating} label={tp("rating", { rating: rating.toFixed(1) })} />
                  <span className="text-muted-foreground">
                    {tp("reviews", { count: product.ratingCount })}
                  </span>
                </p>
              )}
              <p className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-xs">
                <Store className="size-3.5 shrink-0" aria-hidden /> {t("spotlightText")}
              </p>
              {description && (
                <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm text-pretty">
                  {summarize(description)}
                </p>
              )}
              {benefits.length > 0 && (
                <ul className="mt-4 flex flex-wrap justify-center gap-2">
                  {benefits.map((b) => (
                    <li
                      key={b}
                      className="bg-brand-50 text-brand-800 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      <CircleCheck className="text-brand-600 size-3.5" aria-hidden /> {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-border mt-6 border-t pt-6">
                <PurchasePanel
                  productId={product.id}
                  productName={name}
                  variants={toPanelVariants(product.variants)}
                  whatsapp={storeConfig.whatsapp}
                />
              </div>
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
        </section>
      )}

      {/* How to order — one compact row */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 pt-16">
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
          <h2 className="text-2xl font-bold text-balance sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="text-brand-100 mx-auto mt-2 max-w-xl text-pretty">{t("ctaText")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
          <p className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
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
