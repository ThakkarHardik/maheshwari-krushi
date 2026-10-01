import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/storage/image";
import { deleteImageAction, makePrimaryImageAction } from "../actions";
import { getProductFormOptions } from "../data";
import { ProductForm } from "../product-form";
import { DeleteProductButton } from "./delete-product-button";
import { ImageUploader } from "./image-uploader";
import { VariantForm } from "./variant-form";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; variant?: string }>;
}) {
  await requireAdmin("products:manage");
  const { id } = await params;
  const { created, variant: editVariantId } = await searchParams;
  const t = await getTranslations("admin.products");
  const tc = await getTranslations("admin.common");

  const [product, [categories, crops]] = await Promise.all([
    db.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { isActive: true } },
        crops: { select: { cropId: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
          include: { batches: { select: { qtyAvailable: true } } },
        },
      },
    }),
    getProductFormOptions(),
  ]);
  if (!product) notFound();

  const editingVariant = product.variants.find((v) => v.id === editVariantId);
  const hiddenReason = !product.isActive
    ? t("reasonInactive")
    : !product.variants.some((v) => v.isActive)
      ? t("reasonNoVariant")
      : !product.category.isActive
        ? t("reasonCategory")
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/products" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-brand-800 text-2xl font-bold">
          {t("editTitle")}: {product.nameHi}
        </h1>
        <div className="flex items-center gap-3">
          {!hiddenReason && (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="text-brand-700 flex items-center gap-1 text-sm hover:underline"
            >
              <ExternalLink className="size-4" /> {t("viewOnSite")}
            </Link>
          )}
          <DeleteProductButton productId={product.id} />
        </div>
      </div>

      {created && (
        <p role="status" className="bg-brand-50 text-brand-800 rounded-md px-4 py-3 text-sm">
          {t("created")}
        </p>
      )}
      {hiddenReason && (
        <p role="alert" className="bg-accent-300/40 text-brand-900 rounded-md px-4 py-3 text-sm">
          {t("notVisible", { reason: hiddenReason })}
        </p>
      )}

      {/* Pack sizes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("variants.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("variants.hint")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {product.variants.length === 0 ? (
            <p className="text-danger text-sm">{t("variants.none")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-border text-brand-800 border-b">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">{t("variants.label")}</th>
                    <th className="py-2 pr-3 font-semibold">{t("variants.sku")}</th>
                    <th className="py-2 pr-3 font-semibold">{t("variants.mrp")}</th>
                    <th className="py-2 pr-3 font-semibold">{t("variants.price")}</th>
                    <th className="py-2 pr-3 font-semibold">{t("variants.stock")}</th>
                    <th className="py-2 pr-3 font-semibold">{t("status")}</th>
                    <th className="py-2 font-semibold">
                      <span className="sr-only">{tc("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr key={v.id} className="border-border border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{v.label}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{v.sku}</td>
                      <td className="py-2 pr-3">{formatINR(v.mrp)}</td>
                      <td className="py-2 pr-3">{formatINR(v.price)}</td>
                      <td className="py-2 pr-3">{v.batches.reduce((s, b) => s + b.qtyAvailable, 0)}</td>
                      <td className="py-2 pr-3">
                        <span className={v.isActive ? "text-brand-700" : "text-muted-foreground"}>
                          {v.isActive ? tc("active") : tc("inactive")}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <Link
                          href={`/admin/products/${product.id}?variant=${v.id}#variant-form`}
                          className="text-brand-700 hover:underline"
                        >
                          {tc("edit")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div id="variant-form" className="border-border rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">
                {editingVariant ? t("variants.editTitle") : t("variants.addTitle")}
              </h3>
              {editingVariant && (
                <Link
                  href={`/admin/products/${product.id}`}
                  className="text-brand-700 text-sm hover:underline"
                >
                  {tc("cancel")}
                </Link>
              )}
            </div>
            <VariantForm
              key={editingVariant?.id ?? "new"}
              productId={product.id}
              variant={
                editingVariant && {
                  id: editingVariant.id,
                  label: editingVariant.label,
                  sku: editingVariant.sku,
                  packSize: editingVariant.packSize.toString(),
                  unit: editingVariant.unit,
                  mrp: editingVariant.mrp.toString(),
                  price: editingVariant.price.toString(),
                  lowStockThreshold: editingVariant.lowStockThreshold,
                  sortOrder: editingVariant.sortOrder,
                  isActive: editingVariant.isActive,
                }
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("images.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("images.hint")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.images.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("images.none")}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {product.images.map((img, index) => (
                <li key={img.id} className="border-border overflow-hidden rounded-md border">
                  <div className="bg-muted relative aspect-square">
                    <Image src={img.url} alt={img.alt ?? ""} fill sizes="200px" className="object-contain" />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2 py-2 text-xs">
                    {index === 0 ? (
                      <span className="text-brand-700 flex items-center gap-1 font-semibold">
                        <Star className="size-3.5 fill-current" /> {t("images.primary")}
                      </span>
                    ) : (
                      <form action={makePrimaryImageAction}>
                        <input type="hidden" name="imageId" value={img.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <button type="submit" className="text-brand-700 hover:underline">
                          {t("images.makePrimary")}
                        </button>
                      </form>
                    )}
                    <form action={deleteImageAction}>
                      <input type="hidden" name="imageId" value={img.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="text-danger flex items-center gap-1 hover:underline"
                        aria-label={t("images.delete")}
                      >
                        <Trash2 className="size-3.5" /> {t("images.delete")}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ImageUploader productId={product.id} remaining={MAX_IMAGES_PER_PRODUCT - product.images.length} />
        </CardContent>
      </Card>

      {/* Details */}
      <ProductForm
        product={{
          id: product.id,
          nameHi: product.nameHi,
          nameEn: product.nameEn,
          subLabelHi: product.subLabelHi,
          subLabelEn: product.subLabelEn,
          slug: product.slug,
          categoryId: product.categoryId,
          descriptionHi: product.descriptionHi,
          descriptionEn: product.descriptionEn,
          benefitsHi: product.benefitsHi,
          benefitsEn: product.benefitsEn,
          usageHi: product.usageHi,
          usageEn: product.usageEn,
          safetyHi: product.safetyHi,
          manufacturer: product.manufacturer,
          licenceNo: product.licenceNo,
          hsnCode: product.hsnCode,
          gstRate: product.gstRate.toNumber().toString(),
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          cropIds: product.crops.map((c) => c.cropId),
        }}
        categories={categories}
        crops={crops}
        defaultLicenceNo=""
      />
    </div>
  );
}
