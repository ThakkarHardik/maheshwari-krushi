"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckboxField, FormMessage, SelectField, TextAreaField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GST_RATES } from "@/lib/catalog/schemas";
import { slugify } from "@/lib/catalog/slug";
import { useFormSubmit } from "@/lib/use-form-submit";
import { saveProductAction, type ProductFormState } from "./actions";

export type ProductFormValues = {
  id: string;
  nameHi: string;
  nameEn: string | null;
  subLabelHi: string | null;
  subLabelEn: string | null;
  slug: string;
  categoryId: string;
  descriptionHi: string | null;
  descriptionEn: string | null;
  benefitsHi: string[];
  benefitsEn: string[];
  usageHi: string | null;
  usageEn: string | null;
  safetyHi: string | null;
  manufacturer: string | null;
  licenceNo: string | null;
  hsnCode: string;
  gstRate: string;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  cropIds: string[];
};

type Option = { id: string; nameHi: string };

export function ProductForm({
  product,
  categories,
  crops,
  defaultLicenceNo,
}: {
  product?: ProductFormValues;
  categories: Option[];
  crops: Option[];
  defaultLicenceNo: string;
}) {
  const t = useTranslations("admin.products");
  const tc = useTranslations("admin.common");
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProductAction, {});
  const onSubmit = useFormSubmit(formAction);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const errors = state.errors;
  const v = (value: string | null | undefined) => value ?? "";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.basic")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="nameHi"
            label={t("fields.nameHi")}
            errors={errors}
            defaultValue={product?.nameHi}
            required
          />
          <TextField
            name="nameEn"
            label={t("fields.nameEn")}
            errors={errors}
            defaultValue={v(product?.nameEn)}
            onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
          />
          <TextField
            name="subLabelHi"
            label={t("fields.subLabelHi")}
            errors={errors}
            defaultValue={v(product?.subLabelHi)}
          />
          <TextField
            name="subLabelEn"
            label={t("fields.subLabelEn")}
            errors={errors}
            defaultValue={v(product?.subLabelEn)}
          />
          <TextField
            name="slug"
            label={t("fields.slug")}
            errors={errors}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            hint={t("fields.slugHint", { slug: slug || "…" })}
            required
          />
          <SelectField
            name="categoryId"
            label={t("fields.category")}
            errors={errors}
            defaultValue={product?.categoryId ?? ""}
            required
          >
            <option value="" disabled>
              —
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameHi}
              </option>
            ))}
          </SelectField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.content")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextAreaField
            name="descriptionHi"
            label={t("fields.descriptionHi")}
            errors={errors}
            defaultValue={v(product?.descriptionHi)}
            rows={5}
          />
          <TextAreaField
            name="descriptionEn"
            label={t("fields.descriptionEn")}
            errors={errors}
            defaultValue={v(product?.descriptionEn)}
            rows={5}
          />
          <TextAreaField
            name="benefitsHi"
            label={t("fields.benefitsHi")}
            errors={errors}
            defaultValue={product?.benefitsHi.join("\n")}
          />
          <TextAreaField
            name="benefitsEn"
            label={t("fields.benefitsEn")}
            errors={errors}
            defaultValue={product?.benefitsEn.join("\n")}
          />
          <TextAreaField
            name="usageHi"
            label={t("fields.usageHi")}
            errors={errors}
            defaultValue={v(product?.usageHi)}
          />
          <TextAreaField
            name="usageEn"
            label={t("fields.usageEn")}
            errors={errors}
            defaultValue={v(product?.usageEn)}
          />
          <TextAreaField
            name="safetyHi"
            label={t("fields.safetyHi")}
            errors={errors}
            defaultValue={v(product?.safetyHi)}
          />
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{t("fields.crops")}</legend>
            <div className="grid grid-cols-2 gap-x-4">
              {crops.map((crop) => (
                <CheckboxField
                  key={crop.id}
                  name="cropIds"
                  value={crop.id}
                  label={crop.nameHi}
                  defaultChecked={product?.cropIds.includes(crop.id)}
                />
              ))}
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.compliance")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="hsnCode"
            label={t("fields.hsnCode")}
            errors={errors}
            defaultValue={product?.hsnCode}
            inputMode="numeric"
            required
          />
          <SelectField
            name="gstRate"
            label={t("fields.gstRate")}
            errors={errors}
            defaultValue={product?.gstRate ?? "0"}
          >
            {GST_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </SelectField>
          <TextField
            name="manufacturer"
            label={t("fields.manufacturer")}
            errors={errors}
            defaultValue={v(product?.manufacturer)}
          />
          <TextField
            name="licenceNo"
            label={t("fields.licenceNo")}
            errors={errors}
            defaultValue={product ? v(product.licenceNo) : defaultLicenceNo}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.visibility")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <CheckboxField
            name="isActive"
            label={t("fields.isActive")}
            defaultChecked={product?.isActive ?? true}
          />
          <CheckboxField
            name="isFeatured"
            label={t("fields.isFeatured")}
            defaultChecked={product?.isFeatured ?? false}
          />
          <TextField
            name="seoTitle"
            label={t("fields.seoTitle")}
            errors={errors}
            defaultValue={v(product?.seoTitle)}
            maxLength={70}
          />
          <TextField
            name="seoDescription"
            label={t("fields.seoDescription")}
            errors={errors}
            defaultValue={v(product?.seoDescription)}
            maxLength={170}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
        <FormMessage ok={state.ok} errors={errors} />
      </div>
    </form>
  );
}
