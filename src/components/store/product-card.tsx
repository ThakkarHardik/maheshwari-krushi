import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ProductCardData } from "@/lib/catalog/queries";
import { formatINR, localized } from "@/lib/format";
import { ProductImage } from "./product-image";

export async function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const t = await getTranslations("products");
  const tp = await getTranslations("product");
  const locale = await getLocale();
  const name = localized(product.nameHi, product.nameEn, locale);
  const subLabel = localized(product.subLabelHi, product.subLabelEn, locale);
  const cheapest = product.variants[0];
  const href = `/products/${product.slug}`;

  return (
    <article className="group border-border rounded-card flex flex-col overflow-hidden border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} tabIndex={-1} aria-hidden>
        <ProductImage
          src={product.images[0]?.url}
          alt=""
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          placeholderLabel={tp("noImage")}
        />
      </Link>
      <div className="flex flex-1 flex-col items-center gap-1 px-3 pt-3 pb-4 text-center">
        <h3 className="leading-snug font-semibold">
          <Link href={href} className="hover:text-brand-700">
            {name}
          </Link>
        </h3>
        {subLabel && <p className="text-muted-foreground text-sm">{subLabel}</p>}
        {cheapest && (
          <p className="text-brand-800 mt-1 text-lg font-bold">
            {formatINR(cheapest.price)}
            {Number(cheapest.mrp) > Number(cheapest.price) && (
              <span className="text-muted-foreground ml-2 text-sm font-normal line-through">
                {formatINR(cheapest.mrp)}
              </span>
            )}
          </p>
        )}
        <Link
          href={href}
          className="bg-brand-50 text-brand-800 hover:bg-brand-100 mt-auto inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold"
        >
          {t("viewDetails")} ›
        </Link>
      </div>
    </article>
  );
}
