import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, PaymentBadge } from "./badges";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin("orders:view");
  const { status: statusParam, q } = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === statusParam);
  const t = await getTranslations("admin.orders");
  const format = await getFormatter();

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  const query = q?.trim();
  if (query) {
    const digits = query.replace(/\D/g, "");
    where.OR = [
      { orderNumber: { contains: query.toUpperCase().replace(/^#/, "") } },
      { shipName: { contains: query, mode: "insensitive" } },
      ...(digits.length >= 4 ? [{ shipMobile: { contains: digits.slice(-10) } }] : []),
    ];
  }

  const [counts, orders] = await Promise.all([
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      take: 200,
      select: {
        id: true,
        orderNumber: true,
        placedAt: true,
        shipName: true,
        shipMobile: true,
        shipCity: true,
        grandTotal: true,
        status: true,
        paymentStatus: true,
        _count: { select: { items: true } },
      },
    }),
  ]);
  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);
  const tabs = [
    { key: undefined as OrderStatus | undefined, label: t("all"), count: total },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: t(`statuses.${s}`), count: countOf(s) })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label={t("status")}>
        {tabs.map((tab) => (
          <Link
            key={tab.key ?? "all"}
            href={tab.key ? `/admin/orders?status=${tab.key}` : "/admin/orders"}
            aria-current={tab.key === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              tab.key === status
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-border hover:bg-brand-50 bg-white",
            )}
          >
            {tab.label} <span className="opacity-75">({tab.count})</span>
          </Link>
        ))}
      </nav>

      <form className="flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <Input name="q" defaultValue={q} placeholder={t("search")} className="h-10 max-w-sm" />
        <Button type="submit" variant="outline" size="sm" className="h-10">
          {t("filter")}
        </Button>
      </form>

      <Card className="overflow-x-auto">
        {orders.length === 0 ? (
          <p className="text-muted-foreground px-5 py-10 text-center">{t("empty")}</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-border bg-brand-50 text-brand-800 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("orderNo")}</th>
                <th className="px-4 py-3 font-semibold">{t("date")}</th>
                <th className="px-4 py-3 font-semibold">{t("customer")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("items")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("total")}</th>
                <th className="px-4 py-3 font-semibold">{t("payment")}</th>
                <th className="px-4 py-3 font-semibold">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className={cn(
                    "border-border hover:bg-muted border-b last:border-0",
                    o.status === "PENDING" && "bg-accent-300/15",
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-brand-800 font-semibold hover:underline"
                    >
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {format.dateTime(o.placedAt, { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.shipName}</p>
                    <p className="text-muted-foreground text-xs">
                      {o.shipMobile} · {o.shipCity}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">{o._count.items}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatINR(o.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={o.paymentStatus} label={t(`paymentStatuses.${o.paymentStatus}`)} />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} label={t(`statuses.${o.status}`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
