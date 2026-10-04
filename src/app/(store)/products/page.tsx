import type { Metadata } from "next";
import Link from "next/link";
import { Search, Sprout, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/store/breadcrumb";
import { CategoryIcon } from "@/components/store/category-icon";
import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/store/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listingHref, parseListingParams, type ListingParams } from "@/lib/catalog/listing";
import { getStoreCategories, getStoreCrops, listProducts } from "@/lib/catalog/queries";
import { localized } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SortSelect } from "./sort-select";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const t = await getTranslations("products");
  const params = parseListingParams(await searchParams);
  return {
    title: t("title"),
    alternates: { canonical: listingHref({ category: params.category, crop: params.crop }) },
    // Search and sort variations should not be indexed separately.
    robots: params.q || params.sort !== "newest" || params.page > 1 ? { index: false } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = parseListingParams(await searchParams);
  const t = await getTranslations("products");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  const [categories, crops, { products, total, pageCount }] = await Promise.all([
    getStoreCategories(),
    getStoreCrops(),
    listProducts(params, locale),
  ]);
  const activeCategory = categories.find((c) => c.slug === params.category);
  const activeCrop = crops.find((c) => c.slug === params.crop);
  const heading = [
    activeCategory && localized(activeCategory.nameHi, activeCategory.nameEn, locale),
    activeCrop && localized(activeCrop.nameHi, activeCrop.nameEn, locale),
  ]
    .filter(Boolean)
    .join(" · ");

  // Changing one filter keeps the others (and resets to page 1).
  const hrefWith = (change: Partial<ListingParams>) => listingHref({ ...params, page: 1, ...change });

  type ActiveFilter = { label: string; clear: Partial<ListingParams> };
  const activeFilters: ActiveFilter[] = [];
  if (activeCategory) {
    activeFilters.push({
      label: localized(activeCategory.nameHi, activeCategory.nameEn, locale),
      clear: { category: null },
    });
  }
  if (activeCrop) {
    activeFilters.push({
      label: localized(activeCrop.nameHi, activeCrop.nameEn, locale),
      clear: { crop: null },
    });
  }
  if (params.q) activeFilters.push({ label: `"${params.q}"`, clear: { q: null } });

  const filterLink = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition md:rounded-md md:border-0 md:px-3 md:py-2",
      active
        ? "border-brand-700 bg-brand-700 md:bg-brand-50 md:text-brand-800 font-semibold text-white"
        : "border-border hover:bg-brand-50 bg-white hover:translate-x-0.5",
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: tNav("home"), href: "/" },
          heading ? { label: tNav("products"), href: "/products" } : { label: tNav("products") },
          ...(heading ? [{ label: heading }] : []),
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-brand-800 animate-fade-up text-2xl font-bold sm:text-3xl">
            {heading || t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {params.q && <span>{t("searchFor", { q: params.q })} · </span>}
            {t("resultCount", { count: total })}
          </p>
        </div>
        <SortSelect params={params} />
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <Link
              key={f.label}
              href={hrefWith(f.clear)}
              className="bg-brand-50 text-brand-800 hover:bg-brand-100 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition"
            >
              {f.label} <X className="size-3.5" aria-label={t("clearFilters")} />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[230px_1fr]">
        <aside className="min-w-0 space-y-4 md:sticky md:top-20 md:self-start">
          <form action="/products" role="search" className="flex gap-2">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.crop && <input type="hidden" name="crop" value={params.crop} />}
            <Input
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
              className="h-10"
            />
            <Button
              type="submit"
              size="icon"
              variant="primary"
              className="size-10 shrink-0"
              aria-label={t("search")}
            >
              <Search />
            </Button>
          </form>

          <nav
            aria-label={t("categories")}
            className="md:border-border md:rounded-card md:border md:bg-white md:p-3"
          >
            <h2 className="mb-2 hidden text-sm font-semibold md:block">{t("categories")}</h2>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-0 md:px-0">
              <li className="shrink-0">
                <Link
                  href={hrefWith({ category: null })}
                  aria-current={!params.category ? "page" : undefined}
                  className={filterLink(!params.category)}
                >
                  {t("allProducts")}
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug} className="shrink-0">
                  <Link
                    href={hrefWith({ category: c.slug })}
                    aria-current={params.category === c.slug ? "page" : undefined}
                    className={filterLink(params.category === c.slug)}
                  >
                    <CategoryIcon slug={c.slug} className="size-4" />
                    <span className="flex-1">{localized(c.nameHi, c.nameEn, locale)}</span>
                    <span className="text-xs opacity-70">{c._count.products}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {crops.length > 0 && (
            <nav
              aria-label={t("crops")}
              className="md:border-border md:rounded-card md:border md:bg-white md:p-3"
            >
              <h2 className="mb-2 hidden text-sm font-semibold md:block">{t("crops")}</h2>
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-0 md:px-0">
                <li className="shrink-0">
                  <Link
                    href={hrefWith({ crop: null })}
                    aria-current={!params.crop ? "page" : undefined}
                    className={filterLink(!params.crop)}
                  >
                    {t("allCrops")}
                  </Link>
                </li>
                {crops.map((c) => (
                  <li key={c.slug} className="shrink-0">
                    <Link
                      href={hrefWith({ crop: c.slug })}
                      aria-current={params.crop === c.slug ? "page" : undefined}
                      className={filterLink(params.crop === c.slug)}
                    >
                      <Sprout className="size-4" aria-hidden />
                      <span className="flex-1">{localized(c.nameHi, c.nameEn, locale)}</span>
                      <span className="text-xs opacity-70">{c._count.products}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        <section aria-label={t("title")} className="min-w-0">
          {products.length === 0 ? (
            <div className="border-border rounded-card animate-scale-in border bg-white px-6 py-12 text-center">
              <p className="text-muted-foreground">{t("empty")}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/products">{t("clearFilters")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {products.map((product, i) => (
                <Reveal as="li" key={product.slug} delay={Math.min(i, 8) * 60}>
                  <ProductCard product={product} priority={i < 3} />
                </Reveal>
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4 text-sm" aria-label="pagination">
              {params.page > 1 ? (
                <Link
                  href={listingHref({ ...params, page: params.page - 1 })}
                  className="text-brand-700 hover:underline"
                >
                  ‹ {t("prev")}
                </Link>
              ) : (
                <span className="text-muted-foreground">‹ {t("prev")}</span>
              )}
              <span>{t("page", { page: params.page, total: pageCount })}</span>
              {params.page < pageCount ? (
                <Link
                  href={listingHref({ ...params, page: params.page + 1 })}
                  className="text-brand-700 hover:underline"
                >
                  {t("next")} ›
                </Link>
              ) : (
                <span className="text-muted-foreground">{t("next")} ›</span>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
