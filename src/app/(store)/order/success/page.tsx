import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { CircleCheck, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { storeConfig } from "@/config/store";
import { LAST_ORDER_COOKIE } from "@/lib/checkout/schema";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orderSuccess");
  return { title: t("title"), robots: { index: false } };
}

export default async function OrderSuccessPage() {
  const t = await getTranslations("orderSuccess");
  const store = await cookies();
  const orderNumber = store.get(LAST_ORDER_COOKIE)?.value;
  // Only the browser that placed the order sees it (via an httpOnly cookie), never by guessing a URL.
  const order =
    orderNumber && /^[A-Z]{2,6}\d{4,10}$/.test(orderNumber)
      ? await db.order.findUnique({
          where: { orderNumber },
          select: {
            orderNumber: true,
            grandTotal: true,
            paymentMethod: true,
            shipName: true,
            shipLine1: true,
            shipCity: true,
            shipPincode: true,
            items: {
              select: { id: true, productNameHi: true, variantLabel: true, quantity: true, lineTotal: true },
            },
          },
        })
      : null;

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted-foreground">{t("missing")}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="bg-brand-50 rounded-card border-brand-100 border px-6 py-10 text-center">
        <CircleCheck className="text-brand-700 mx-auto size-16" aria-hidden />
        <h1 className="text-brand-800 mt-4 text-2xl font-bold">{t("thanks")}</h1>
        <p className="border-brand-200 mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-md border bg-white px-6 py-3 text-lg">
          {t("orderNumber")} <strong className="text-brand-800 text-xl">#{order.orderNumber}</strong>
        </p>
        <p className="text-muted-foreground mx-auto mt-6 max-w-md">{t("confirming")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">{t("home")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/track?order=${order.orderNumber}`}>{t("track")}</Link>
          </Button>
          <Button asChild size="lg" variant="accent">
            <a
              href={buildWhatsAppLink(
                storeConfig.whatsapp,
                t("whatsappMessage", { number: order.orderNumber }),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle /> {t("whatsapp")}
            </a>
          </Button>
        </div>
      </div>

      <section className="border-border rounded-card mt-6 border bg-white px-6 py-5">
        <h2 className="text-brand-800 mb-3 font-semibold">{t("items")}</h2>
        <ul className="divide-border divide-y text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2">
              <span>
                {item.productNameHi} ({item.variantLabel}) × {item.quantity}
              </span>
              <span className="font-medium">{formatINR(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="border-border mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-base font-bold">
            <dt>{t("total")}</dt>
            <dd className="text-brand-800">{formatINR(order.grandTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("payment")}</dt>
            <dd>{order.paymentMethod === "COD" ? t("cod") : order.paymentMethod}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("deliverTo")}</dt>
            <dd className="text-right">
              {order.shipName}, {order.shipLine1}, {order.shipCity} – {order.shipPincode}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
