import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/store/breadcrumb";
import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listingHref, parseListingParams } from "@/lib/catalog/listing";
import { getStoreCategories, listProducts } from "@/lib/catalog/queries";
import { localized } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SortSelect } from "./sort-select";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const t = await getTranslations("products");
  const params = parseListingParams(await searchParams);
  return {
    title: t("title"),
    alternates: { canonical: listingHref({ category: params.category }) },
    // Search and sort variations should not be indexed separately.
    robots: params.q || params.sort !== "newest" || params.page > 1 ? { index: false } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = parseListingParams(await searchParams);
  const t = await getTranslations("products");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  const [categories, { products, total, pageCount }] = await Promise.all([
    getStoreCategories(),
    listProducts(params),
  ]);
  const activeCategory = categories.find((c) => c.slug === params.category);
  const categoryLinks = [
    { slug: null, label: t("allProducts") },
    ...categories.map((c) => ({ slug: c.slug, label: localized(c.nameHi, c.nameEn, locale) })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: tNav("home"), href: "/" },
          activeCategory ? { label: tNav("products"), href: "/products" } : { label: tNav("products") },
          ...(activeCategory
            ? [{ label: localized(activeCategory.nameHi, activeCategory.nameEn, locale) }]
            : []),
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-brand-800 text-2xl font-bold sm:text-3xl">
            {activeCategory ? localized(activeCategory.nameHi, activeCategory.nameEn, locale) : t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {params.q && <span>{t("searchFor", { q: params.q })} · </span>}
            {t("resultCount", { count: total })}
          </p>
        </div>
        <SortSelect params={params} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="min-w-0 space-y-4">
          <form action="/products" role="search" className="flex gap-2">
            {params.category && <input type="hidden" name="category" value={params.category} />}
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
              {categoryLinks.map((c) => {
                const active = (c.slug ?? null) === params.category;
                return (
                  <li key={c.slug ?? "all"} className="shrink-0">
                    <Link
                      href={listingHref({ category: c.slug, sort: params.sort, q: params.q })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-full border px-4 py-1.5 text-sm whitespace-nowrap md:rounded-md md:border-0 md:px-3 md:py-2",
                        active
                          ? "border-brand-700 bg-brand-700 md:bg-brand-50 md:text-brand-800 font-semibold text-white"
                          : "border-border hover:bg-brand-50 bg-white",
                      )}
                    >
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <section aria-label={t("title")} className="min-w-0">
          {products.length === 0 ? (
            <div className="border-border rounded-card border bg-white px-6 py-12 text-center">
              <p className="text-muted-foreground">{t("empty")}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/products">{t("clearFilters")}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {products.map((product, i) => (
                <li key={product.id} className="flex">
                  <div className="w-full">
                    <ProductCard product={product} priority={i < 3} />
                  </div>
                </li>
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
