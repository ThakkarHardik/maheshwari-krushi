import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Prisma } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireAdmin("products:manage");
  const { q, category } = await searchParams;
  const t = await getTranslations("admin");

  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (category) where.categoryId = category;
  if (q?.trim()) {
    const contains = { contains: q.trim(), mode: "insensitive" as const };
    where.OR = [{ nameHi: contains }, { nameEn: contains }, { variants: { some: { sku: contains } } }];
  }

  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameHi: true } }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        nameHi: true,
        subLabelHi: true,
        isActive: true,
        isFeatured: true,
        minPrice: true,
        category: { select: { nameHi: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        variants: {
          select: { isActive: true, batches: { select: { qtyAvailable: true } } },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-brand-800 text-2xl font-bold">{t("products.title")}</h1>
          <p className="text-muted-foreground">{t("products.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus /> {t("products.add")}
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-3" role="search">
        <Input name="q" defaultValue={q} placeholder={t("products.search")} className="max-w-xs" />
        <Select name="category" defaultValue={category ?? ""} className="max-w-xs">
          <option value="">{t("products.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameHi}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          {t("products.filter")}
        </Button>
      </form>

      <Card className="overflow-x-auto">
        {products.length === 0 ? (
          <p className="text-muted-foreground px-5 py-8 text-center">{t("products.empty")}</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-border bg-brand-50 text-brand-800 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("products.image")}</th>
                <th className="px-4 py-3 font-semibold">{t("products.name")}</th>
                <th className="px-4 py-3 font-semibold">{t("products.category")}</th>
                <th className="px-4 py-3 font-semibold">{t("products.price")}</th>
                <th className="px-4 py-3 font-semibold">{t("products.stock")}</th>
                <th className="px-4 py-3 font-semibold">{t("products.status")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = p.variants.reduce(
                  (sum, v) => sum + v.batches.reduce((s, b) => s + b.qtyAvailable, 0),
                  0,
                );
                const activeVariants = p.variants.filter((v) => v.isActive).length;
                return (
                  <tr key={p.id} className="border-border hover:bg-muted border-b last:border-0">
                    <td className="px-4 py-2">
                      <div className="bg-muted relative size-12 overflow-hidden rounded-md">
                        {p.images[0] ? (
                          <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <ImageOff className="text-muted-foreground absolute inset-0 m-auto size-5" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-brand-800 font-medium hover:underline"
                      >
                        {p.nameHi}
                      </Link>
                      {p.subLabelHi && <p className="text-muted-foreground text-xs">{p.subLabelHi}</p>}
                    </td>
                    <td className="px-4 py-2">{p.category.nameHi}</td>
                    <td className="px-4 py-2">
                      {p.minPrice ? (
                        formatINR(p.minPrice)
                      ) : (
                        <span className="text-danger">{t("products.noVariants")}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{activeVariants > 0 ? stock : "—"}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={
                            p.isActive
                              ? "bg-brand-50 text-brand-700 rounded px-2 py-0.5 text-xs font-medium"
                              : "bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium"
                          }
                        >
                          {p.isActive ? t("common.active") : t("products.hidden")}
                        </span>
                        {p.isFeatured && (
                          <span className="bg-accent-300 text-brand-900 rounded px-2 py-0.5 text-xs font-medium">
                            {t("products.featured")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
