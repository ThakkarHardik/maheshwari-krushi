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
import { listingHref } from "@/lib/catalog/listing";
import { getApprovedReviews, getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";
import { nextExpiry, sellableQuantity } from "@/lib/catalog/stock";
import { localized, localizedList } from "@/lib/format";
import { Gallery } from "./gallery";
import { PurchasePanel, type PanelVariant } from "./purchase-panel";
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

  const variants: PanelVariant[] = product.variants.map((v) => {
    const stock = sellableQuantity(v.batches);
    return {
      id: v.id,
      label: v.label,
      price: v.price.toString(),
      mrp: v.mrp.toString(),
      stock,
      lowStock: stock > 0 && stock <= v.lowStockThreshold,
    };
  });
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

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <Gallery images={product.images} name={name} />

        <div className="space-y-5">
          <div>
            <h1 className="text-brand-800 text-2xl leading-tight font-bold sm:text-3xl">
              {name}{" "}
              {subLabel && <span className="text-muted-foreground text-xl font-medium">{subLabel}</span>}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm">
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
            </div>
          </div>

          <PurchasePanel
            productId={product.id}
            productName={name}
            variants={variants}
            whatsapp={storeConfig.whatsapp}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {description && (
            <section>
              <h2 className="text-brand-800 mb-2 text-xl font-semibold">{t("description")}</h2>
              <p className="whitespace-pre-line">{description}</p>
            </section>
          )}
          {product.crops.length > 0 && (
            <section>
              <h2 className="text-brand-800 mb-2 text-xl font-semibold">{t("crops")}</h2>
              <ul className="flex flex-wrap gap-2">
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
            </section>
          )}
          {benefits.length > 0 && (
            <section>
              <h2 className="text-brand-800 mb-2 text-xl font-semibold">{t("benefits")}</h2>
              <ul className="space-y-2">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-2">
                    <CircleCheck className="text-brand-600 mt-0.5 size-5 shrink-0" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {usage && (
            <section>
              <h2 className="text-brand-800 mb-2 text-xl font-semibold">{t("usage")}</h2>
              <p className="whitespace-pre-line">{usage}</p>
            </section>
          )}
          {product.safetyHi && (
            <section>
              <h2 className="text-brand-800 mb-2 text-xl font-semibold">{t("safety")}</h2>
              <p className="bg-accent-300/30 rounded-md px-4 py-3 whitespace-pre-line">{product.safetyHi}</p>
            </section>
          )}
        </div>

        <aside>
          <h2 className="text-brand-800 mb-2 text-xl font-semibold">{t("details")}</h2>
          <dl className="border-border rounded-card divide-border divide-y border bg-white text-sm">
            {details.map((d) => (
              <div key={d.label} className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="text-right font-medium">{d.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <section id="reviews" className="mt-10 space-y-4" aria-labelledby="reviews-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="reviews-heading" className="text-brand-800 text-xl font-semibold">
            {tr("title")}
          </h2>
          {product.ratingCount > 0 && (
            <span className="flex items-center gap-2 text-sm">
              <Stars rating={rating} label={t("rating", { rating: rating.toFixed(1) })} />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">{t("reviews", { count: product.ratingCount })}</span>
            </span>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">{tr("none")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="border-border rounded-card border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={r.rating} label={t("rating", { rating: r.rating })} />
                  <span className="text-muted-foreground text-xs">
                    {format.dateTime(r.createdAt, { dateStyle: "medium" })}
                  </span>
                </div>
                {r.comment && <p className="mt-2 whitespace-pre-line">{r.comment}</p>}
                <p className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
                  {r.name}
                  <span className="text-brand-700 inline-flex items-center gap-0.5 text-xs font-medium">
                    · <BadgeCheck className="size-3.5" aria-hidden /> {tr("verified")}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <ReviewForm productId={product.id} />
      </section>

      {related.length > 0 && (
        <Reveal as="section" className="mt-12">
          <h2 className="text-brand-800 mb-4 text-xl font-semibold">{tl("related")}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
