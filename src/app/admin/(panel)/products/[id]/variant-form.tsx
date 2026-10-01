"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckboxField, FormMessage, SelectField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { UNITS } from "@/lib/catalog/schemas";
import { useFormSubmit } from "@/lib/use-form-submit";
import { saveVariantAction, type VariantFormState } from "../actions";

export type VariantValues = {
  id: string;
  label: string;
  sku: string;
  packSize: string;
  unit: string;
  mrp: string;
  price: string;
  lowStockThreshold: number;
  sortOrder: number;
  isActive: boolean;
};

export function VariantForm({ productId, variant }: { productId: string; variant?: VariantValues }) {
  const t = useTranslations("admin.products");
  const tc = useTranslations("admin.common");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<VariantFormState, FormData>(saveVariantAction, {});
  const onSubmit = useFormSubmit(formAction);
  const errors = state.errors;

  useEffect(() => {
    if (state.ok && !variant) formRef.current?.reset();
  }, [state, variant]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="productId" value={productId} />
      {variant && <input type="hidden" name="variantId" value={variant.id} />}
      <TextField
        name="label"
        label={t("variants.label")}
        errors={errors}
        defaultValue={variant?.label}
        required
      />
      <TextField
        name="sku"
        label={t("variants.sku")}
        errors={errors}
        defaultValue={variant?.sku}
        className="uppercase"
        required
      />
      <TextField
        name="packSize"
        label={t("variants.packSize")}
        errors={errors}
        defaultValue={variant?.packSize}
        inputMode="decimal"
        required
      />
      <SelectField
        name="unit"
        label={t("variants.unit")}
        errors={errors}
        defaultValue={variant?.unit ?? "KG"}
      >
        {UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {t(`units.${unit}`)}
          </option>
        ))}
      </SelectField>
      <TextField
        name="mrp"
        label={t("variants.mrp")}
        errors={errors}
        defaultValue={variant?.mrp}
        inputMode="decimal"
        required
      />
      <TextField
        name="price"
        label={t("variants.price")}
        errors={errors}
        defaultValue={variant?.price}
        inputMode="decimal"
        required
      />
      <TextField
        name="lowStockThreshold"
        label={t("variants.lowStock")}
        errors={errors}
        type="number"
        min={0}
        defaultValue={variant?.lowStockThreshold ?? 5}
      />
      <TextField
        name="sortOrder"
        label={t("variants.sortOrder")}
        errors={errors}
        type="number"
        min={0}
        defaultValue={variant?.sortOrder ?? 0}
      />
      <CheckboxField
        name="isActive"
        label={t("variants.isActive")}
        defaultChecked={variant?.isActive ?? true}
        className="sm:col-span-2"
      />
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : variant ? tc("save") : t("variants.add")}
        </Button>
        <FormMessage ok={state.ok} errors={errors} />
      </div>
    </form>
  );
}
