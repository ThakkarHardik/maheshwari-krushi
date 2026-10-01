import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { expiryStatus, stockLevel } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";
import { ExpiryBadge, LevelBadge } from "../badges";
import { MovementTable } from "../movement-table";
import { AdjustStockForm, ReceiveStockForm } from "./stock-forms";

export default async function VariantStockPage({ params }: { params: Promise<{ variantId: string }> }) {
  await requireAdmin("inventory:manage");
  const { variantId } = await params;
  const t = await getTranslations("admin.inventory");
  const format = await getFormatter();

  const variant = await db.productVariant.findFirst({
    where: { id: variantId, product: { deletedAt: null } },
    include: {
      product: { select: { id: true, nameHi: true } },
      batches: { orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { receivedAt: "asc" }] },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { batch: { select: { batchNo: true } }, adminUser: { select: { name: true } } },
      },
    },
  });
  if (!variant) notFound();

  const now = new Date();
  const sellable = variant.batches
    .filter((b) => expiryStatus(b.expiryDate, now) !== "EXPIRED")
    .reduce((s, b) => s + b.qtyAvailable, 0);
  const expired = variant.batches
    .filter((b) => expiryStatus(b.expiryDate, now) === "EXPIRED")
    .reduce((s, b) => s + b.qtyAvailable, 0);
  const level = stockLevel(sellable, variant.lowStockThreshold);
  const date = (d: Date | null) => (d ? format.dateTime(d, { dateStyle: "medium" }) : "—");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/inventory" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-brand-800 text-2xl font-bold">
          {t("detailTitle", { product: variant.product.nameHi, pack: variant.label })}
        </h1>
        <LevelBadge level={level} label={t(`levels.${level}`)} />
      </div>
      <p className="text-muted-foreground text-sm">
        <span className="font-mono">{variant.sku}</span> · {t("totals", { sellable, expired })} ·{" "}
        {t("lowAt", { count: variant.lowStockThreshold })}
      </p>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>{t("batches")}</CardTitle>
        </CardHeader>
        {variant.batches.length === 0 ? (
          <p className="text-muted-foreground px-5 py-6">{t("noBatches")}</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-border text-brand-800 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("batchNo")}</th>
                <th className="px-4 py-3 font-semibold">{t("mfgDate")}</th>
                <th className="px-4 py-3 font-semibold">{t("expiryDate")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("received")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("available")}</th>
                <th className="px-4 py-3 font-semibold">{t("costPrice")}</th>
                <th className="px-4 py-3 font-semibold">{t("supplier")}</th>
                <th className="px-4 py-3 font-semibold">{t("receivedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {variant.batches.map((b) => {
                const status = expiryStatus(b.expiryDate, now);
                return (
                  <tr
                    key={b.id}
                    className={cn(
                      "border-border border-b last:border-0",
                      b.qtyAvailable === 0 && "text-muted-foreground",
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-xs">{b.batchNo}</td>
                    <td className="px-4 py-2">{date(b.mfgDate)}</td>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-2">
                        {date(b.expiryDate)}
                        {(status === "EXPIRED" || status === "NEAR") && (
                          <ExpiryBadge status={status} label={t(`expiry.${status}`)} />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{b.qtyReceived}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{b.qtyAvailable}</td>
                    <td className="px-4 py-2">{b.costPrice ? formatINR(b.costPrice) : "—"}</td>
                    <td className="px-4 py-2">{b.supplier ?? "—"}</td>
                    <td className="px-4 py-2">{date(b.receivedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("receiveTitle")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("receiveHint")}</p>
        </CardHeader>
        <CardContent>
          <ReceiveStockForm variantId={variant.id} />
        </CardContent>
      </Card>

      {variant.batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("adjustTitle")}</CardTitle>
            <p className="text-muted-foreground text-sm">{t("adjustHint")}</p>
          </CardHeader>
          <CardContent>
            <AdjustStockForm
              batches={variant.batches.map((b) => ({
                id: b.id,
                label: `${b.batchNo} — ${t("available")}: ${b.qtyAvailable}${b.expiryDate ? ` · ${t("expiryDate")}: ${date(b.expiryDate)}` : ""}`,
              }))}
            />
          </CardContent>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>{t("history")}</CardTitle>
        </CardHeader>
        <MovementTable rows={variant.stockMovements} />
      </Card>
    </div>
  );
}
