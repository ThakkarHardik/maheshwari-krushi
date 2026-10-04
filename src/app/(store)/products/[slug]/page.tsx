import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BadgeCheck, CircleCheck } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/store/breadcrumb";
import { Stars } from "@/components/store/stars";
import { TrustStrip } from "@/components/store/trust-strip";
import { storeConfig } from "@/config/store";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/store/reveal";
import { SectionHeading } from "@/components/store/section-heading";
import { listingHref } from "@/lib/catalog/listing";
import { getApprovedReviews, getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";
import { toPanelVariants } from "@/lib/catalog/panel";
import { nextExpiry } from "@/lib/catalog/stock";
import { localized, localizedList } from "@/lib/format";
import { Gallery } from "./gallery";
import { InfoTabs } from "./info-tabs";
import { PurchasePanel } from "./purchase-panel";
import { ReviewForm } from "./review-form";

type Params = Promise<{ slug: string }>;

const loadProduct = cache((slug: string) => getProductBySlug(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return {};
  const locale = await getLocale();
  const name = localized(product.nameHi, product.nameEn, locale);
  const description =
    product.seoDescription ?? localized(product.descriptionHi, product.descriptionEn, locale)?.slice(0, 160);
  return {
    title: product.seoTitle ?? name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: name,
      description: description ?? undefined,
      images: product.images.slice(0, 1).map((i) => i.url),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const format = await getFormatter();
  const tr = await getTranslations("reviews");
  const tl = await getTranslations("products");
  const [reviews, related] = await Promise.all([
    getApprovedReviews(product.id),
    getRelatedProducts(product.id, product.categoryId, locale),
  ]);

  const name = localized(product.nameHi, product.nameEn, locale);
  const subLabel = localized(product.subLabelHi, product.subLabelEn, locale);
  const description = localized(product.descriptionHi, product.descriptionEn, locale);
  const benefits = localizedList(product.benefitsHi, product.benefitsEn, locale);
  const usage = localized(product.usageHi, product.usageEn, locale);
  const categoryName = localized(product.category.nameHi, product.category.nameEn, locale);
  const allBatches = product.variants.flatMap((v) => v.batches);
  const expiry = nextExpiry(allBatches);

  const variants = toPanelVariants(product.variants);
  const rating = product.ratingAvg.toNumber();
  const anyInStock = variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.slug,
    category: categoryName,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: product.minPrice?.toString(),
      offerCount: variants.length,
      availability: anyInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: storeConfig.name },
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: product.ratingCount },
    }),
  };

  const details = [
    { label: t("category"), value: categoryName },
    product.manufacturer && { label: t("manufacturer"), value: product.manufacturer },
    product.licenceNo && { label: t("licence"), value: product.licenceNo },
    expiry && { label: t("expiry"), value: format.dateTime(expiry, { month: "short", year: "numeric" }) },
  ].filter((d): d is { label: string; value: string } => Boolean(d));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped so it cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Breadcrumb
        items={[
          { label: tNav("home"), href: "/" },
          { label: tNav("products"), href: "/products" },
          { label: categoryName, href: `/products?category=${product.category.slug}` },
          { label: name },
        ]}
      />

      <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
        <Gallery images={product.images} name={name} />

        <div className="rounded-card space-y-5 bg-white p-5 text-center shadow-sm ring-1 ring-black/5 sm:p-6">
          <div>
            <p className="text-brand-600 text-sm font-semibold">{categoryName}</p>
            <h1 className="text-brand-800 mt-1 text-2xl leading-tight font-bold text-balance sm:text-3xl">
              {name}{" "}
              {subLabel && <span className="text-muted-foreground text-xl font-medium">{subLabel}</span>}
            </h1>
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm hover:underline">
              {product.ratingCount > 0 ? (
                <>
                  <Stars rating={rating} label={t("rating", { rating: rating.toFixed(1) })} />
                  <span className="text-muted-foreground">
                    {t("reviews", { count: product.ratingCount })}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{t("noReviews")}</span>
              )}
            </a>
          </div>

          <PurchasePanel
            productId={product.id}
            productName={name}
            variants={variants}
            whatsapp={storeConfig.whatsapp}
          />
        </div>
      </div>

      <Reveal as="section" className="mx-auto mt-10 max-w-4xl">
        <InfoTabs
          tabs={[
            {
              key: "about",
              label: t("description"),
              content: (
                <div className="space-y-5">
                  {description && (
                    <p className="mx-auto max-w-2xl text-pretty whitespace-pre-line">{description}</p>
                  )}
                  {benefits.length > 0 && (
                    <div>
                      <h2 className="text-brand-800 mb-3 font-semibold">{t("benefits")}</h2>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {benefits.map((b) => (
                          <li
                            key={b}
                            className="bg-brand-50 flex items-center justify-center gap-2 rounded-lg px-3 py-2"
                          >
                            <CircleCheck className="text-brand-600 size-5 shrink-0" aria-hidden />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {product.crops.length > 0 && (
                    <div>
                      <h2 className="text-brand-800 mb-3 font-semibold">{t("crops")}</h2>
                      <ul className="flex flex-wrap justify-center gap-2">
                        {product.crops.map(({ crop }) => (
                          <li key={crop.slug}>
                            <Link
                              href={listingHref({ crop: crop.slug })}
                              className="border-border hover:border-brand-700 hover:bg-brand-700 inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm transition hover:text-white"
                            >
                              {localized(crop.nameHi, crop.nameEn, locale)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ),
            },
            ...(usage
              ? [
                  {
                    key: "usage",
                    label: t("usage"),
                    content: <p className="mx-auto max-w-2xl whitespace-pre-line">{usage}</p>,
                  },
                ]
              : []),
            ...(product.safetyHi
              ? [
                  {
                    key: "safety",
                    label: t("safety"),
                    content: (
                      <p className="bg-accent-300/30 mx-auto max-w-2xl rounded-md px-4 py-3 whitespace-pre-line">
                        {product.safetyHi}
                      </p>
                    ),
                  },
                ]
              : []),
            {
              key: "details",
              label: t("details"),
              content: (
                <dl className="border-border divide-border mx-auto max-w-md divide-y rounded-lg border text-sm">
                  {details.map((d) => (
                    <div key={d.label} className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-muted-foreground">{d.label}</dt>
                      <dd className="text-right font-medium">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
          ]}
        />
      </Reveal>

      <section
        id="reviews"
        className="mx-auto mt-12 max-w-4xl scroll-mt-24 space-y-5"
        aria-labelledby="reviews-heading"
      >
        <SectionHeading id="reviews-heading" title={tr("title")} />
        {product.ratingCount > 0 && (
          <p className="flex items-center justify-center gap-2 text-sm">
            <Stars rating={rating} label={t("rating", { rating: rating.toFixed(1) })} />
            <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">{t("reviews", { count: product.ratingCount })}</span>
          </p>
        )}
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center">{tr("none")}</p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-card w-full bg-white p-5 text-center shadow-sm ring-1 ring-black/5 md:w-[calc(50%-0.375rem)]"
              >
                <Stars rating={r.rating} label={t("rating", { rating: r.rating })} />
                {r.comment && <p className="mt-2 whitespace-pre-line">“{r.comment}”</p>}
                <p className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-1 text-sm">
                  {r.name}
                  <span className="text-brand-700 inline-flex items-center gap-0.5 text-xs font-medium">
                    · <BadgeCheck className="size-3.5" aria-hidden /> {tr("verified")}
                  </span>
                  <span className="text-xs">· {format.dateTime(r.createdAt, { dateStyle: "medium" })}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-center">
          <ReviewForm productId={product.id} />
        </div>
      </section>

      {related.length > 0 && (
        <Reveal as="section" className="mt-14">
          <SectionHeading title={tl("related")} />
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      <div className="border-border bg-brand-50 rounded-card mt-10 border px-4 py-5">
        <TrustStrip />
      </div>
    </div>
  );
}
