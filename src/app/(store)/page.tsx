import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/store/product-card";
import { TrustStrip } from "@/components/store/trust-strip";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts } from "@/lib/catalog/queries";

export default async function HomePage() {
  const t = await getTranslations("home");
  const featured = await getFeaturedProducts(8);

  return (
    <>
      <section className="from-brand-800 via-brand-700 to-brand-600 bg-gradient-to-br text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-xl text-4xl leading-tight font-bold sm:text-5xl">{t("heroTitle")}</h1>
          <p className="text-brand-100 mt-4 text-lg sm:text-xl">{t("heroTagline")}</p>
          <Button asChild variant="accent" size="lg" className="mt-8">
            <Link href="/products">{t("shopNow")}</Link>
          </Button>
        </div>
      </section>

      <section className="border-border bg-brand-50 border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <TrustStrip />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-brand-800 text-center text-2xl font-bold sm:text-3xl">
            {t("featuredTitle")}
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} priority={i < 2} />
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link href="/products">{t("viewAll")}</Link>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
