"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormSubmit } from "@/lib/use-form-submit";
import { CheckboxField, FormMessage, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/catalog/slug";
import { saveCategoryAction, type CategoryFormState } from "./actions";

type Category = {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryForm({ category }: { category?: Category }) {
  const t = useTranslations("admin");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(saveCategoryAction, {});
  const onSubmit = useFormSubmit(formAction);
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  useEffect(() => {
    if (state.ok && !category) {
      formRef.current?.reset();
      setSlug("");
      setSlugTouched(false);
    }
  }, [state, category]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <TextField
        name="nameHi"
        label={t("categories.nameHi")}
        errors={state.errors}
        defaultValue={category?.nameHi}
        required
      />
      <TextField
        name="nameEn"
        label={t("categories.nameEn")}
        errors={state.errors}
        defaultValue={category?.nameEn}
        required
        onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
      />
      <TextField
        name="slug"
        label={t("categories.slug")}
        errors={state.errors}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value);
        }}
        required
      />
      <TextField
        name="sortOrder"
        label={t("categories.sortOrder")}
        errors={state.errors}
        type="number"
        min={0}
        max={999}
        defaultValue={category?.sortOrder ?? 0}
      />
      <CheckboxField
        name="isActive"
        label={t("categories.isActive")}
        defaultChecked={category?.isActive ?? true}
      />
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : category ? t("common.save") : t("categories.add")}
        </Button>
        <FormMessage ok={state.ok} errors={state.errors} />
      </div>
    </form>
  );
}
