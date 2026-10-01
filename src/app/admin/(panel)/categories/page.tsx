import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CategoryForm } from "./category-form";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin("products:manage");
  const { edit } = await searchParams;
  const t = await getTranslations("admin");

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  });
  const editing = edit ? categories.find((c) => c.id === edit) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("categories.title")}</h1>
        <p className="text-muted-foreground">{t("categories.subtitle")}</p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-border bg-brand-50 text-brand-800 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("categories.sortOrder")}</th>
              <th className="px-4 py-3 font-semibold">{t("categories.nameHi")}</th>
              <th className="px-4 py-3 font-semibold">{t("categories.nameEn")}</th>
              <th className="px-4 py-3 font-semibold">{t("categories.products")}</th>
              <th className="px-4 py-3 font-semibold">{t("categories.status")}</th>
              <th className="px-4 py-3 font-semibold">
                <span className="sr-only">{t("common.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-border border-b last:border-0">
                <td className="text-muted-foreground px-4 py-3">{c.sortOrder}</td>
                <td className="px-4 py-3 font-medium">{c.nameHi}</td>
                <td className="px-4 py-3">{c.nameEn}</td>
                <td className="px-4 py-3">{c._count.products}</td>
                <td className="px-4 py-3">
                  <span className={c.isActive ? "text-brand-700" : "text-muted-foreground"}>
                    {c.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/categories?edit=${c.id}`} className="text-brand-700 hover:underline">
                    {t("common.edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{editing ? t("categories.editTitle") : t("categories.addTitle")}</CardTitle>
          {editing && (
            <Link href="/admin/categories" className="text-brand-700 text-sm hover:underline">
              {t("common.cancel")}
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <CategoryForm key={editing?.id ?? "new"} category={editing} />
        </CardContent>
      </Card>
    </div>
  );
}
