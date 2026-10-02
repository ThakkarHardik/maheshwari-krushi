import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  "",
  "/products",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/shipping-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, deletedAt: null, minPrice: { not: null }, category: { isActive: true } },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...STATIC_PAGES.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const })),
    ...categories.map((c) => ({ url: `${base}/products?category=${c.slug}`, lastModified: c.updatedAt })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
