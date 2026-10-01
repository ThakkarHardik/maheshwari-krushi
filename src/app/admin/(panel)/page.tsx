import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const { denied } = await searchParams;
  const t = await getTranslations("admin");

  const canSeeEnquiries = hasPermission(admin.role, "enquiries:manage");
  const canSeeProducts = hasPermission(admin.role, "products:manage");
  const [newEnquiries, activeProducts] = await Promise.all([
    canSeeEnquiries ? db.enquiry.count({ where: { status: "NEW" } }) : null,
    canSeeProducts
      ? db.product.count({ where: { isActive: true, deletedAt: null, minPrice: { not: null } } })
      : null,
  ]);

  return (
    <div className="space-y-4">
      {denied && (
        <p role="alert" className="text-danger rounded-md bg-red-50 px-4 py-3 text-sm">
          {t("dashboard.denied")}
        </p>
      )}
      <h1 className="text-brand-800 text-2xl font-bold">{t("dashboard.welcome", { name: admin.name })}</h1>
      <p className="text-muted-foreground">{t("dashboard.role", { role: t(`roles.${admin.role}`) })}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {newEnquiries !== null && (
          <Card className={newEnquiries > 0 ? "border-accent-400" : undefined}>
            <CardContent className="space-y-1 py-5">
              <p className="text-muted-foreground text-sm">{t("dashboard.newEnquiries")}</p>
              <p className="text-brand-800 text-3xl font-bold">{newEnquiries}</p>
              <Link href="/admin/enquiries?status=NEW" className="text-brand-700 text-sm hover:underline">
                {t("dashboard.viewEnquiries")}
              </Link>
            </CardContent>
          </Card>
        )}
        {activeProducts !== null && (
          <Card>
            <CardContent className="space-y-1 py-5">
              <p className="text-muted-foreground text-sm">{t("dashboard.activeProducts")}</p>
              <p className="text-brand-800 text-3xl font-bold">{activeProducts}</p>
              <Link href="/admin/products" className="text-brand-700 text-sm hover:underline">
                {t("nav.products")} →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="text-muted-foreground py-6">{t("dashboard.comingSoon")}</CardContent>
      </Card>
    </div>
  );
}
