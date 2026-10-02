import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MessageCircle, Package, Phone } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { allowedNextStatuses } from "@/lib/orders/status";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { OrderStatusBadge, PaymentBadge } from "../badges";
import { AdminNoteForm, CodCollectedButton, SendOnWhatsApp, StatusActions } from "./order-controls";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin("orders:view");
  const { id } = await params;
  const t = await getTranslations("admin.orders");
  const format = await getFormatter();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { allocations: { include: { batch: { select: { batchNo: true, expiryDate: true } } } } },
      },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { adminUser: { select: { name: true } } } },
      notifications: { where: { audience: "CUSTOMER" }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const next = allowedNextStatuses(order.status, admin.role);
  const isCod = order.paymentMethod === "COD";
  const intra = order.igstTotal.isZero();
  const when = (d: Date) => format.dateTime(d, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/orders" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-brand-800 text-2xl font-bold">
          {t("detailTitle", { number: order.orderNumber })}
        </h1>
        <OrderStatusBadge status={order.status} label={t(`statuses.${order.status}`)} />
        <PaymentBadge status={order.paymentStatus} label={t(`paymentStatuses.${order.paymentStatus}`)} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/orders/${order.id}/invoice`} target="_blank">
              <FileText /> {t("invoice")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/orders/${order.id}/packing-slip`} target="_blank">
              <Package /> {t("packingSlip")}
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        {t("placedAt", { date: when(order.placedAt) })} ·{" "}
        {order.invoiceNumber ? t("invoiceNo", { number: order.invoiceNumber }) : t("invoiceLater")}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-border bg-brand-50 text-brand-800 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("product")}</th>
                  <th className="px-4 py-3 font-semibold">{t("batches")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("qty")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("rate")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-border border-b">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.productNameHi}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.variantLabel} · {item.sku} · HSN {item.hsnCode} · GST {item.gstRate.toNumber()}%
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {item.allocations.map((a) => (
                        <div key={a.batchId}>
                          {a.batch.batchNo} × {a.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatINR(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto max-w-xs space-y-1 px-4 py-4 text-sm">
              <Row label={t("subtotal")} value={formatINR(order.subtotal)} />
              <Row label={t("shipping")} value={formatINR(order.shippingCharge)} />
              <Row label={t("grandTotal")} value={formatINR(order.grandTotal)} strong />
              <div className="text-muted-foreground border-border mt-2 space-y-1 border-t pt-2 text-xs">
                <Row label={t("taxable")} value={formatINR(order.taxableTotal)} />
                {intra ? (
                  <>
                    <Row label={t("cgst")} value={formatINR(order.cgstTotal)} />
                    <Row label={t("sgst")} value={formatINR(order.sgstTotal)} />
                  </>
                ) : (
                  <Row label={t("igst")} value={formatINR(order.igstTotal)} />
                )}
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("messages")}</CardTitle>
              <p className="text-muted-foreground text-sm">{t("messagesHint")}</p>
            </CardHeader>
            <CardContent>
              {order.notifications.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("noMessages")}</p>
              ) : (
                <ul className="space-y-3">
                  {order.notifications.map((n) => (
                    <li key={n.id} className="border-border rounded-md border p-3 text-sm">
                      <p className="whitespace-pre-line">{n.body}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs">{when(n.createdAt)}</span>
                        {n.status === "QUEUED" || n.status === "FAILED" ? (
                          <SendOnWhatsApp id={n.id} mobile={n.recipient} body={n.body} />
                        ) : (
                          <span className="text-brand-700 text-xs font-semibold">{t("sentManual")}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="border-brand-100 space-y-3 border-l-2 pl-4">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="relative text-sm">
                    <span className="bg-brand-600 absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full" />
                    <p className="font-medium">{t(`statuses.${h.toStatus}`)}</p>
                    <p className="text-muted-foreground text-xs">
                      {when(h.createdAt)} · {h.adminUser ? t("by", { name: h.adminUser.name }) : t("system")}
                    </p>
                    {h.note && <p className="mt-1">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={cn(next.length > 0 && "border-brand-600")}>
            <CardHeader>
              <CardTitle>{t("nextStep")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusActions orderId={order.id} next={next} isCod={isCod} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("deliverTo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <address className="not-italic">
                <p className="font-semibold">{order.shipName}</p>
                <p>{order.shipLine1}</p>
                <p>
                  {order.shipCity}, {order.shipState} – {order.shipPincode}
                </p>
                <p className="mt-1">+91 {order.shipMobile}</p>
              </address>
              {order.customerNote && (
                <p className="bg-accent-300/30 rounded-md px-3 py-2">
                  <span className="font-semibold">{t("customerNote")}:</span> {order.customerNote}
                </p>
              )}
              {(order.courierName || order.trackingNumber) && (
                <p className="text-muted-foreground">
                  {order.courierName && t("shippedVia", { courier: order.courierName })}{" "}
                  {order.trackingNumber && t("trackingNo", { number: order.trackingNumber })}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:+91${order.shipMobile}`}
                  className="border-border hover:bg-brand-50 flex items-center gap-1 rounded-md border px-3 py-2"
                >
                  <Phone className="size-4" /> {t("call")}
                </a>
                <a
                  href={buildWhatsAppLink(`91${order.shipMobile}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-whatsapp flex items-center gap-1 rounded-md px-3 py-2 font-medium text-white"
                >
                  <MessageCircle className="size-4" /> {t("whatsapp")}
                </a>
              </div>
            </CardContent>
          </Card>

          {isCod && (
            <Card>
              <CardHeader>
                <CardTitle>{t("payment")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <PaymentBadge
                  status={order.paymentStatus}
                  label={t(`paymentStatuses.${order.paymentStatus}`)}
                />
                {order.codCollectedAt && <p>{t("codAt", { date: when(order.codCollectedAt) })}</p>}
                {order.paymentStatus === "COD_PENDING" && order.status === "DELIVERED" && (
                  <CodCollectedButton orderId={order.id} />
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-4">
              <AdminNoteForm orderId={order.id} note={order.adminNote} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        strong && "border-border border-t pt-1 text-base font-bold",
      )}
    >
      <dt>{label}</dt>
      <dd className={strong ? "text-brand-800" : undefined}>{value}</dd>
    </div>
  );
}
