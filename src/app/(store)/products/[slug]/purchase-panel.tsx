"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { EnquiryDialog } from "@/components/store/enquiry-dialog";
import { Button } from "@/components/ui/button";
import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PanelVariant = {
  id: string;
  label: string;
  price: string;
  mrp: string;
  stock: number;
  lowStock: boolean;
};

const MAX_QTY = 99;
// Lets long labels like "Enquiry / WhatsApp" wrap instead of overflowing narrow columns.
const ACTION_BUTTON = "h-auto min-h-12 py-2 text-base leading-tight whitespace-normal";

export function PurchasePanel({
  productId,
  productName,
  variants,
  whatsapp,
}: {
  productId: string;
  productName: string;
  variants: PanelVariant[];
  whatsapp: string;
}) {
  const t = useTranslations("product");
  const firstInStock = variants.findIndex((v) => v.stock > 0);
  const [selected, setSelected] = useState(firstInStock >= 0 ? firstInStock : 0);
  const [qty, setQty] = useState(1);
  const variant = variants[selected];
  const maxQty = Math.max(1, Math.min(MAX_QTY, variant.stock));
  const off = discountPercent(variant.mrp, variant.price);
  const inStock = variant.stock > 0;

  function choose(index: number) {
    setSelected(index);
    setQty((q) => Math.min(q, Math.max(1, Math.min(MAX_QTY, variants[index].stock))));
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-brand-800 text-3xl font-bold">{formatINR(variant.price)}</span>
          {off > 0 && (
            <>
              <span className="text-muted-foreground line-through">
                {t("mrp")} {formatINR(variant.mrp)}
              </span>
              <span className="bg-brand-50 text-brand-700 rounded px-2 py-0.5 text-sm font-semibold">
                {t("off", { percent: off })}
              </span>
            </>
          )}
        </p>
        <p className="text-muted-foreground text-sm">{t("inclTax")}</p>
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t("packSize")}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => (
              <label
                key={v.id}
                className={cn(
                  "cursor-pointer rounded-md border px-4 py-2 text-sm font-medium has-[:focus-visible]:outline-2",
                  i === selected
                    ? "border-brand-700 bg-brand-50 text-brand-800"
                    : "border-border hover:bg-brand-50",
                  v.stock === 0 && "opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={i === selected}
                  onChange={() => choose(i)}
                  className="sr-only"
                />
                {v.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {variants.length === 1 && (
        <p className="text-sm">
          <span className="font-semibold">{t("packSize")}:</span> {variant.label}
        </p>
      )}

      <p className={cn("text-sm font-semibold", inStock ? "text-brand-700" : "text-danger")}>
        {!inStock
          ? t("outOfStock")
          : variant.lowStock
            ? t("lowStock", { count: variant.stock })
            : t("inStock")}
      </p>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">{t("quantity")}:</span>
        <div className="border-border inline-flex items-center rounded-md border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label={t("decrease")}
            className="flex size-11 items-center justify-center disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <output aria-live="polite" className="w-10 text-center font-semibold">
            {qty}
          </output>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty || !inStock}
            aria-label={t("increase")}
            className="flex size-11 items-center justify-center disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Cart & checkout arrive in Phase 5. */}
        <Button size="lg" disabled title={t("cartSoon")} className={ACTION_BUTTON}>
          <Zap /> {t("buyNow")}
        </Button>
        <Button size="lg" variant="secondary" disabled title={t("cartSoon")} className={ACTION_BUTTON}>
          <ShoppingCart /> {t("addToCart")}
        </Button>
        <EnquiryDialog
          whatsapp={whatsapp}
          productId={productId}
          productName={`${productName} (${variant.label})`}
          getDefaultMessage={() =>
            t("whatsappMessage", { product: productName, variant: variant.label, qty })
          }
          triggerClassName={ACTION_BUTTON}
          label={t("enquiry")}
        />
      </div>
      <p className="text-muted-foreground text-sm">{t("cartSoon")}</p>
    </div>
  );
}
