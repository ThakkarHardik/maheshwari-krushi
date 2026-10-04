"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductCardView } from "@/lib/catalog/queries";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { Stars } from "./stars";

/**
 * Product card. Hover (mouse) or the "+" button (touch / keyboard) shows a quick
 * summary over the photo; clicking anywhere else on the card opens the product page.
 */
export function ProductCard({ product, priority }: { product: ProductCardView; priority?: boolean }) {
  const t = useTranslations("products");
  const tp = useTranslations("product");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const href = `/products/${product.slug}`;

  return (
    <article
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      className="group border-border rounded-card focus-within:ring-brand-600 relative flex h-full flex-col overflow-hidden border bg-white shadow-sm transition duration-300 ease-out focus-within:ring-2 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          placeholderLabel={tp("noImage")}
          className="transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <div className="pointer-events-none absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
          {product.offPercent > 0 && (
            <span className="bg-accent-400 text-brand-900 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm">
              {tp("off", { percent: product.offPercent })}
            </span>
          )}
          {!product.inStock && (
            <span className="bg-danger rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              {tp("outOfStock")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? t("closeQuickView") : t("quickView", { name: product.name })}
          className="text-brand-800 hover:bg-brand-700 absolute top-2 right-2 z-30 flex size-10 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:text-white active:scale-90"
        >
          <Plus className={cn("size-5 transition-transform duration-300", open && "rotate-45")} aria-hidden />
        </button>

        {/* Quick summary: slides up on hover, or when "+" is pressed. */}
        <div
          id={panelId}
          data-open={open || undefined}
          className={cn(
            "bg-brand-900/92 absolute inset-0 z-10 flex flex-col justify-end gap-1.5 px-3 pt-14 pb-3 text-left text-white backdrop-blur-[2px] sm:gap-2",
            "translate-y-full opacity-0 transition duration-300 ease-out",
            "group-hover:translate-y-0 group-hover:opacity-100 data-[open]:translate-y-0 data-[open]:opacity-100",
          )}
        >
          {product.summary && (
            <p className="line-clamp-2 text-xs leading-snug sm:line-clamp-4 sm:text-sm">{product.summary}</p>
          )}
          {product.packs.length > 0 && (
            <ul className="flex flex-wrap gap-1" aria-label={tp("packSize")}>
              {product.packs.map((pack) => (
                <li key={pack} className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
                  {pack}
                </li>
              ))}
            </ul>
          )}
          <p className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
            <span className={product.inStock ? "text-brand-100" : "text-accent-300"}>
              {product.inStock ? `✓ ${tp("inStock")}` : tp("outOfStock")}
            </span>
            <span className="text-accent-300 inline-flex items-center gap-1 font-semibold">
              {t("viewFull")} <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 pt-3 pb-4">
        <p className="text-brand-600 text-xs font-semibold tracking-wide">{product.category}</p>
        <h3 className="group-hover:text-brand-700 leading-snug font-semibold transition-colors">
          {product.name}
        </h3>
        {product.subLabel && <p className="text-muted-foreground text-sm">{product.subLabel}</p>}
        {product.ratingCount > 0 && (
          <p className="flex items-center gap-1 text-xs">
            <Stars rating={product.rating} label={tp("rating", { rating: product.rating.toFixed(1) })} />
            <span className="text-muted-foreground">({product.ratingCount})</span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
          {product.packs.length > 1 && (
            <span className="text-muted-foreground w-full text-xs">{t("from")}</span>
          )}
          <span className="text-brand-800 text-lg font-bold">{formatINR(product.price)}</span>
          {product.offPercent > 0 && (
            <span className="text-muted-foreground text-sm line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        {product.packs.length > 1 && (
          <p className="text-muted-foreground text-xs">{t("packCount", { count: product.packs.length })}</p>
        )}
      </div>

      {/* Whole card opens the product page; the "+" button sits above this link. */}
      <Link
        href={href}
        className="rounded-card absolute inset-0 z-[15]"
        aria-label={`${product.name} — ${t("viewDetails")}`}
      />
    </article>
  );
}
