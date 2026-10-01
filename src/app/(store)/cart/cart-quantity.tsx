"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { updateCartItemAction } from "@/lib/cart/actions";

export function CartQuantity({ itemId, quantity, max }: { itemId: string; quantity: number; max: number }) {
  const t = useTranslations("product");
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(quantity);
  const limit = Math.max(1, Math.min(99, max));

  function change(next: number) {
    const value = Math.max(1, Math.min(limit, next));
    if (value === qty) return;
    setQty(value);
    startTransition(async () => {
      const result = await updateCartItemAction({ itemId, quantity: value });
      if (result.available !== undefined) setQty(result.available);
    });
  }

  return (
    <div className="border-border inline-flex items-center rounded-md border bg-white" aria-busy={pending}>
      <button
        type="button"
        onClick={() => change(qty - 1)}
        disabled={pending || qty <= 1}
        aria-label={t("decrease")}
        className="flex size-10 items-center justify-center disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <output aria-live="polite" className="w-8 text-center font-semibold">
        {qty}
      </output>
      <button
        type="button"
        onClick={() => change(qty + 1)}
        disabled={pending || qty >= limit}
        aria-label={t("increase")}
        className="flex size-10 items-center justify-center disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
