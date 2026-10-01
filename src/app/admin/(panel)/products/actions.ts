"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { fieldErrors, formDataToObject, productSchema, variantSchema } from "@/lib/catalog/schemas";
import { syncMinPrice } from "@/lib/catalog/variants";
import { db } from "@/lib/db";
import { getStorage, removeStoredFile } from "@/lib/storage";
import { checkImage, MAX_IMAGES_PER_PRODUCT } from "@/lib/storage/image";

function revalidateProduct(productId: string, slug?: string) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

// ─── Product ────────────────────────────────────────────────

export type ProductFormState = { ok?: boolean; errors?: Record<string, string> };

export async function saveProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin("products:manage");
  const id = (formData.get("id") as string | null) || null;
  const parsed = productSchema.safeParse(formDataToObject(formData, ["cropIds"]));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { cropIds, ...data } = parsed.data;

  const [slugClash, category] = await Promise.all([
    db.product.findFirst({
      where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    }),
    db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
  ]);
  if (slugClash) return { errors: { slug: "slugTaken" } };
  if (!category) return { errors: { categoryId: "categoryMissing" } };

  const validCropIds = (await db.crop.findMany({ where: { id: { in: cropIds } }, select: { id: true } })).map(
    (c) => c.id,
  );

  const saved = await db.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id, deletedAt: null }, data })
      : await tx.product.create({ data });
    await tx.productCrop.deleteMany({ where: { productId: product.id } });
    if (validCropIds.length) {
      await tx.productCrop.createMany({
        data: validCropIds.map((cropId) => ({ productId: product.id, cropId })),
      });
    }
    return product;
  });

  await writeAudit({
    adminUserId: admin.id,
    action: id ? "product.update" : "product.create",
    entityType: "Product",
    entityId: saved.id,
    meta: { slug: saved.slug, isActive: saved.isActive },
  });
  revalidateProduct(saved.id, saved.slug);

  if (!id) redirect(`/admin/products/${saved.id}?created=1`);
  return { ok: true };
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requireAdmin("products:manage");
  const id = z.string().min(1).parse(formData.get("id"));
  // Soft delete: keeps order history intact.
  const product = await db.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false, isFeatured: false },
  });
  await writeAudit({ adminUserId: admin.id, action: "product.delete", entityType: "Product", entityId: id });
  revalidateProduct(id, product.slug);
  redirect("/admin/products");
}

// ─── Variants (pack sizes) ──────────────────────────────────

export type VariantFormState = { ok?: boolean; errors?: Record<string, string> };

export async function saveVariantAction(
  _prev: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  const admin = await requireAdmin("products:manage");
  const productId = z.string().min(1).parse(formData.get("productId"));
  const variantId = (formData.get("variantId") as string | null) || null;
  const parsed = variantSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const product = await db.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!product) return { errors: { _form: "notFound" } };

  const skuClash = await db.productVariant.findFirst({
    where: { sku: data.sku, ...(variantId ? { id: { not: variantId } } : {}) },
    select: { id: true },
  });
  if (skuClash) return { errors: { sku: "skuTaken" } };

  const saved = await db.$transaction(async (tx) => {
    const variant = variantId
      ? await tx.productVariant.update({ where: { id: variantId, productId }, data })
      : await tx.productVariant.create({ data: { ...data, productId } });
    await syncMinPrice(tx, productId);
    return variant;
  });

  await writeAudit({
    adminUserId: admin.id,
    action: variantId ? "variant.update" : "variant.create",
    entityType: "ProductVariant",
    entityId: saved.id,
    meta: { productId, sku: saved.sku, price: data.price, mrp: data.mrp, isActive: data.isActive },
  });
  revalidateProduct(productId, product.slug);
  return { ok: true };
}

// ─── Images ─────────────────────────────────────────────────

export type ImageUploadState = { ok?: boolean; error?: string };

export async function uploadImagesAction(
  _prev: ImageUploadState,
  formData: FormData,
): Promise<ImageUploadState> {
  const admin = await requireAdmin("products:manage");
  const productId = z.string().min(1).parse(formData.get("productId"));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "noFile" };

  const product = await db.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { slug: true, nameHi: true, _count: { select: { images: true } } },
  });
  if (!product) return { error: "failed" };
  if (product._count.images + files.length > MAX_IMAGES_PER_PRODUCT) return { error: "tooMany" };

  // Validate everything before storing anything.
  const checked = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = checkImage(bytes);
    if (!result.ok) return { error: result.error };
    checked.push({ bytes, kind: result.kind });
  }

  const storage = getStorage();
  const last = await db.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
  let sortOrder = (last._max.sortOrder ?? -1) + 1;
  try {
    for (const { bytes, kind } of checked) {
      const stored = await storage.save(bytes, kind, "products");
      await db.productImage.create({
        data: {
          productId,
          url: stored.url,
          storageKey: stored.key,
          alt: product.nameHi,
          sortOrder: sortOrder++,
        },
      });
    }
  } catch (error) {
    console.error("Image upload failed", error);
    return { error: "failed" };
  }

  await writeAudit({
    adminUserId: admin.id,
    action: "product.images_upload",
    entityType: "Product",
    entityId: productId,
    meta: { count: checked.length },
  });
  revalidateProduct(productId, product.slug);
  return { ok: true };
}

const imageIdSchema = z.object({ imageId: z.string().min(1), productId: z.string().min(1) });

export async function deleteImageAction(formData: FormData) {
  const admin = await requireAdmin("products:manage");
  const { imageId, productId } = imageIdSchema.parse(Object.fromEntries(formData));
  const image = await db.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) return;
  await db.productImage.delete({ where: { id: imageId } });
  await removeStoredFile(image.storageKey);
  await writeAudit({
    adminUserId: admin.id,
    action: "product.image_delete",
    entityType: "Product",
    entityId: productId,
  });
  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidateProduct(productId, product?.slug);
}

export async function makePrimaryImageAction(formData: FormData) {
  await requireAdmin("products:manage");
  const { imageId, productId } = imageIdSchema.parse(Object.fromEntries(formData));
  const images = await db.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (!images.some((img) => img.id === imageId)) return;
  const ordered = [imageId, ...images.map((img) => img.id).filter((id) => id !== imageId)];
  await db.$transaction(
    ordered.map((id, index) => db.productImage.update({ where: { id }, data: { sortOrder: index } })),
  );
  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidateProduct(productId, product?.slug);
}
