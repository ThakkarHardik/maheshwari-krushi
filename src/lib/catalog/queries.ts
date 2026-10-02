import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE, type ListingParams } from "./listing";

/** Products a customer may see: active, not deleted, in an active category, with at least one active pack size. */
const publicProductWhere = {
  isActive: true,
  deletedAt: null,
  minPrice: { not: null },
  category: { isActive: true },
} satisfies Prisma.ProductWhereInput;

const productCardSelect = {
  id: true,
  slug: true,
  nameHi: true,
  nameEn: true,
  subLabelHi: true,
  subLabelEn: true,
  minPrice: true,
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" },
    take: 1,
    select: { mrp: true, price: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function getFeaturedProducts(limit = 8) {
  return db.product.findMany({
    where: { ...publicProductWhere, isFeatured: true },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
}

export function getStoreCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
    select: { id: true, slug: true, nameHi: true, nameEn: true },
  });
}

export async function listProducts(params: ListingParams) {
  const where: Prisma.ProductWhereInput = { ...publicProductWhere };
  if (params.category) where.category = { isActive: true, slug: params.category };
  if (params.q) {
    const contains = { contains: params.q, mode: "insensitive" as const };
    where.OR = [
      { nameHi: contains },
      { nameEn: contains },
      { subLabelHi: contains },
      { subLabelEn: contains },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    params.sort === "price-asc"
      ? [{ minPrice: { sort: "asc", nulls: "last" } }, { id: "asc" }]
      : params.sort === "price-desc"
        ? [{ minPrice: { sort: "desc", nulls: "last" } }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: productCardSelect,
    }),
  ]);
  return { total, products, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { ...publicProductWhere, slug },
    include: {
      category: { select: { slug: true, nameHi: true, nameEn: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
      crops: { select: { crop: { select: { nameHi: true, nameEn: true } } } },
      variants: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
        select: {
          id: true,
          label: true,
          mrp: true,
          price: true,
          lowStockThreshold: true,
          batches: { select: { qtyAvailable: true, expiryDate: true } },
        },
      },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export function getApprovedReviews(productId: string, take = 20) {
  return db.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, name: true, rating: true, comment: true, createdAt: true, customerId: true },
  });
}
