"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { EnquiryDialog } from "@/components/store/enquiry-dialog";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/lib/cart/actions";
import type { PanelVariant } from "@/lib/catalog/panel";
import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export type { PanelVariant } from "@/lib/catalog/panel";

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
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "added" | "limited" | "error"; text: string } | null>(
    null,
  );

  function add(buyNow: boolean) {
    setFeedback(null);
    startTransition(async () => {
      // With buyNow the action redirects to checkout and doesn't return here.
      const result = await addToCartAction({ variantId: variant.id, quantity: qty, buyNow });
      if (!result.ok) {
        setFeedback({ kind: "error", text: t(result.error === "outOfStock" ? "outOfStock" : "unavailable") });
      } else if (result.error === "limited") {
        setFeedback({ kind: "limited", text: t("limited", { count: result.available ?? 0 }) });
      } else {
        setFeedback({ kind: "added", text: t("added") });
      }
    });
  }

  function choose(index: number) {
    setSelected(index);
    setFeedback(null);
    setQty((q) => Math.min(q, Math.max(1, Math.min(MAX_QTY, variants[index].stock))));
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
          <span key={variant.id} className="text-brand-800 animate-scale-in text-4xl font-bold">
            {formatINR(variant.price)}
          </span>
          {off > 0 && (
            <>
              <span className="text-muted-foreground line-through">
                {t("mrp")} {formatINR(variant.mrp)}
              </span>
              <span className="bg-accent-400 text-brand-900 rounded-full px-2.5 py-0.5 text-sm font-bold">
                {t("off", { percent: off })}
              </span>
            </>
          )}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{t("inclTax")}</p>
      </div>

      {variants.length > 1 ? (
        <fieldset>
          <legend className="mx-auto mb-2 text-sm font-semibold">{t("packSize")}</legend>
          <div className="flex flex-wrap justify-center gap-2">
            {variants.map((v, i) => (
              <label
                key={v.id}
                className={cn(
                  "flex min-w-24 cursor-pointer flex-col items-center rounded-xl border-2 px-4 py-2 transition duration-200 has-[:focus-visible]:outline-2",
                  i === selected
                    ? "border-brand-700 bg-brand-50 text-brand-800 shadow-sm"
                    : "border-border hover:border-brand-200 hover:bg-brand-50/60",
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
                <span className="font-semibold">{v.label}</span>
                <span className="text-muted-foreground text-xs">{formatINR(v.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm">
          <span className="font-semibold">{t("packSize")}:</span> {variant.label}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{t("quantity")}:</span>
          <div className="border-border inline-flex items-center rounded-full border bg-white">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label={t("decrease")}
              className="hover:bg-brand-50 flex size-11 items-center justify-center rounded-full transition disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <output aria-live="polite" className="w-10 text-center text-lg font-semibold">
              {qty}
            </output>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty || !inStock}
              aria-label={t("increase")}
              className="hover:bg-brand-50 flex size-11 items-center justify-center rounded-full transition disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
        <p className={cn("text-sm font-semibold", inStock ? "text-brand-700" : "text-danger")}>
          {!inStock
            ? t("outOfStock")
            : variant.lowStock
              ? t("lowStock", { count: variant.stock })
              : `✓ ${t("inStock")}`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Button
          size="lg"
          disabled={!inStock || pending}
          onClick={() => add(true)}
          className={cn(ACTION_BUTTON, "transition hover:-translate-y-0.5 hover:shadow-lg")}
        >
          <Zap /> {t("buyNow")}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={!inStock || pending}
          onClick={() => add(false)}
          className={cn(ACTION_BUTTON, "transition hover:-translate-y-0.5 hover:shadow-lg")}
        >
          <ShoppingCart /> {pending ? t("adding") : t("addToCart")}
        </Button>
        <EnquiryDialog
          whatsapp={whatsapp}
          productId={productId}
          productName={`${productName} (${variant.label})`}
          getDefaultMessage={() =>
            t("whatsappMessage", { product: productName, variant: variant.label, qty })
          }
          triggerClassName={cn(ACTION_BUTTON, "transition hover:-translate-y-0.5 hover:shadow-lg")}
          label={t("enquiry")}
        />
      </div>
      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "animate-scale-in flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md px-4 py-3 text-sm font-medium",
            feedback.kind === "error" ? "text-danger bg-red-50" : "bg-brand-50 text-brand-800",
          )}
        >
          {feedback.text}
          {feedback.kind !== "error" && (
            <Link href="/cart" className="text-brand-700 font-semibold underline">
              {t("viewCart")} →
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
