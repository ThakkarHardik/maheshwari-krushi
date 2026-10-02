import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { getInventoryOverview, summarizeInventory } from "@/lib/inventory/overview";

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
  const canSeeStock = hasPermission(admin.role, "inventory:manage");
  // Start of today in India (IST), as a UTC instant.
  const istNow = new Date(Date.now() + 5.5 * 3_600_000);
  const startOfDay = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - 5.5 * 3_600_000,
  );
  const [pendingOrders, today, newEnquiries, activeProducts, stock] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.order.aggregate({
      where: { placedAt: { gte: startOfDay }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _count: { _all: true },
      _sum: { grandTotal: true },
    }),
    canSeeEnquiries ? db.enquiry.count({ where: { status: "NEW" } }) : null,
    canSeeProducts
      ? db.product.count({ where: { isActive: true, deletedAt: null, minPrice: { not: null } } })
      : null,
    canSeeStock ? getInventoryOverview().then(summarizeInventory) : null,
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
        <Card className={pendingOrders > 0 ? "border-accent-400" : undefined}>
          <CardContent className="space-y-1 py-5">
            <p className="text-muted-foreground text-sm">{t("dashboard.newOrders")}</p>
            <p className="text-brand-800 text-3xl font-bold">{pendingOrders}</p>
            <Link href="/admin/orders?status=PENDING" className="text-brand-700 text-sm hover:underline">
              {t("dashboard.viewOrders")}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-5">
            <p className="text-muted-foreground text-sm">{t("dashboard.todaySales")}</p>
            <p className="text-brand-800 text-3xl font-bold">{formatINR(today._sum.grandTotal ?? 0)}</p>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.todayOrders", { count: today._count._all })}
            </p>
          </CardContent>
        </Card>
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
        {stock && (
          <Card className={stock.low + stock.out > 0 ? "border-accent-400" : undefined}>
            <CardContent className="space-y-1 py-5">
              <p className="text-muted-foreground text-sm">{t("dashboard.lowStock")}</p>
              <p className="text-brand-800 text-3xl font-bold">{stock.low + stock.out}</p>
              <Link href="/admin/inventory?filter=low" className="text-brand-700 text-sm hover:underline">
                {t("dashboard.viewStock")}
              </Link>
            </CardContent>
          </Card>
        )}
        {stock && (
          <Card className={stock.nearExpiry + stock.expired > 0 ? "border-accent-400" : undefined}>
            <CardContent className="space-y-1 py-5">
              <p className="text-muted-foreground text-sm">{t("dashboard.nearExpiry")}</p>
              <p className="text-brand-800 text-3xl font-bold">{stock.nearExpiry + stock.expired}</p>
              <Link href="/admin/inventory?filter=near" className="text-brand-700 text-sm hover:underline">
                {t("dashboard.viewStock")}
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
