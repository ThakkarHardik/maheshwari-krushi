import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";
import { requireAdmin } from "@/lib/auth/session";
import { getProductFormOptions } from "../data";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireAdmin("products:manage");
  const t = await getTranslations("admin.products");
  const [categories, crops] = await getProductFormOptions();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/products" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>
      <h1 className="text-brand-800 text-2xl font-bold">{t("newTitle")}</h1>
      <ProductForm categories={categories} crops={crops} defaultLicenceNo={storeConfig.licenceNo} />
    </div>
  );
}
