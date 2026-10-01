"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "../actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const t = useTranslations("admin.products");
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!window.confirm(t("deleteConfirm"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <Button type="submit" variant="outline" size="sm" className="border-danger text-danger hover:bg-red-50">
        <Trash2 /> {t("delete")}
      </Button>
    </form>
  );
}
