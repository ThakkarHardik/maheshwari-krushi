import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { discountPercent, localized } from "@/lib/format";
import { PAGE_SIZE, type ListingParams } from "./listing";
import { sellableQuantity } from "./stock";
import { summarize } from "./summary";

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
  descriptionHi: true,
  descriptionEn: true,
  minPrice: true,
  ratingAvg: true,
  ratingCount: true,
  category: { select: { nameHi: true, nameEn: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    select: {
      label: true,
      mrp: true,
      price: true,
      batches: { where: { qtyAvailable: { gt: 0 } }, select: { qtyAvailable: true, expiryDate: true } },
    },
  },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

/** Everything a product card shows — plain, serialisable values for client components. */
export type ProductCardView = {
  slug: string;
  name: string;
  subLabel: string | null;
  category: string;
  imageUrl: string | null;
  price: string;
  mrp: string;
  offPercent: number;
  packs: string[];
  inStock: boolean;
  rating: number;
  ratingCount: number;
  summary: string | null;
};

export function toCardView(p: ProductCardRow, locale: string): ProductCardView {
  const cheapest = [...p.variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
  return {
    slug: p.slug,
    name: localized(p.nameHi, p.nameEn, locale),
    subLabel: localized(p.subLabelHi, p.subLabelEn, locale),
    category: localized(p.category.nameHi, p.category.nameEn, locale),
    imageUrl: p.images[0]?.url ?? null,
    price: cheapest?.price.toString() ?? p.minPrice?.toString() ?? "0",
    mrp: cheapest?.mrp.toString() ?? "0",
    offPercent: cheapest ? discountPercent(cheapest.mrp, cheapest.price) : 0,
    packs: p.variants.map((v) => v.label),
    inStock: p.variants.some((v) => sellableQuantity(v.batches) > 0),
    rating: p.ratingAvg.toNumber(),
    ratingCount: p.ratingCount,
    summary: summarize(localized(p.descriptionHi, p.descriptionEn, locale)),
  };
}

export async function getFeaturedProducts(locale: string, limit = 8) {
  const rows = await db.product.findMany({
    where: { ...publicProductWhere, isFeatured: true },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
  return rows.map((p) => toCardView(p, locale));
}

/** Other products from the same category, for the product page. */
export async function getRelatedProducts(productId: string, categoryId: string, locale: string, limit = 4) {
  const rows = await db.product.findMany({
    where: { ...publicProductWhere, categoryId, id: { not: productId } },
    orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
  return rows.map((p) => toCardView(p, locale));
}

export function getStoreCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
    select: {
      id: true,
      slug: true,
      nameHi: true,
      nameEn: true,
      _count: { select: { products: { where: publicProductWhere } } },
    },
  });
}

/** Crops that have at least one product on sale, for "shop by crop". */
export async function getStoreCrops() {
  const crops = await db.crop.findMany({
    orderBy: { nameHi: "asc" },
    select: {
      slug: true,
      nameHi: true,
      nameEn: true,
      seasons: true,
      _count: { select: { products: { where: { product: publicProductWhere } } } },
    },
  });
  return crops.filter((c) => c._count.products > 0);
}

export async function listProducts(params: ListingParams, locale: string) {
  const where: Prisma.ProductWhereInput = { ...publicProductWhere };
  if (params.category) where.category = { isActive: true, slug: params.category };
  if (params.crop) where.crops = { some: { crop: { slug: params.crop } } };
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

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: productCardSelect,
    }),
  ]);
  return {
    total,
    products: rows.map((p) => toCardView(p, locale)),
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

const productDetailInclude = {
  category: { select: { slug: true, nameHi: true, nameEn: true } },
  images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
  crops: { select: { crop: { select: { slug: true, nameHi: true, nameEn: true } } } },
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
} satisfies Prisma.ProductInclude;

/**
 * The product shown on the home page: the most recently updated featured
 * product (mark the product you sell as "featured" in the admin panel).
 */
export async function getSpotlightProduct() {
  const [product, total] = await Promise.all([
    db.product.findFirst({
      where: { ...publicProductWhere, isFeatured: true },
      orderBy: [{ updatedAt: "desc" }],
      include: productDetailInclude,
    }),
    db.product.count({ where: publicProductWhere }),
  ]);
  return { product, otherProducts: Math.max(0, total - (product ? 1 : 0)) };
}

export function getProductBySlug(slug: string) {
  return db.product.findFirst({ where: { ...publicProductWhere, slug }, include: productDetailInclude });
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
