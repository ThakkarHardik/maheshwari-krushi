import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeCartItemAction } from "@/lib/cart/actions";
import { getCart } from "@/lib/cart/server";
import { formatINR, localized } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CartQuantity } from "./cart-quantity";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title"), robots: { index: false } };
}

export default async function CartPage() {
  const t = await getTranslations("cart");
  const locale = await getLocale();
  const { lines, totals, problems } = await getCart();
  const rupees = (paise: number) => formatINR(paise / 100);

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <ShoppingCart className="text-brand-200 size-16" aria-hidden />
        <h1 className="text-brand-800 mt-4 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("empty")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/products">{t("startShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-brand-800 text-2xl font-bold sm:text-3xl">{t("title")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <div className="border-border text-brand-800 hidden grid-cols-[64px_1fr_120px_100px_100px_40px] gap-x-4 border-b px-5 py-3 text-sm font-semibold md:grid">
              <span className="col-span-2">{t("product")}</span>
              <span>{t("quantity")}</span>
              <span className="text-right">{t("price")}</span>
              <span className="text-right">{t("lineTotal")}</span>
              <span className="sr-only">{t("remove")}</span>
            </div>
            <ul className="divide-border divide-y">
              {lines.map((line) => {
                const name = localized(line.nameHi, line.nameEn, locale);
                const lineTotal = Number(line.unitPrice) * line.quantity;
                const overStock = !line.unavailable && line.quantity > line.stock;
                return (
                  <li
                    key={line.itemId}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 md:grid-cols-[64px_1fr_120px_100px_100px_40px]"
                  >
                    <Link href={`/products/${line.slug}`} className="row-span-2 md:row-span-1">
                      <ProductImage
                        src={line.imageUrl}
                        alt=""
                        sizes="64px"
                        className={cn("rounded-md", line.unavailable && "opacity-50")}
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/products/${line.slug}`} className="font-semibold hover:underline">
                        {name}
                      </Link>
                      <p className="text-muted-foreground text-sm">{line.label}</p>
                      {line.unavailable && <p className="text-danger text-sm">{t("unavailable")}</p>}
                      {overStock && (
                        <p className="text-danger text-sm">{t("onlyLeft", { count: line.stock })}</p>
                      )}
                    </div>
                    <form action={removeCartItemAction} className="justify-self-end md:order-last">
                      <input type="hidden" name="itemId" value={line.itemId} />
                      <button
                        type="submit"
                        aria-label={t("removeItem", { name })}
                        className="text-muted-foreground hover:text-danger flex size-10 items-center justify-center rounded-md hover:bg-red-50"
                      >
                        <X className="size-5" />
                      </button>
                    </form>
                    <div className="col-span-2 flex items-center justify-between gap-3 md:contents">
                      {line.unavailable ? (
                        <span />
                      ) : (
                        <CartQuantity itemId={line.itemId} quantity={line.quantity} max={line.stock} />
                      )}
                      <span className="text-muted-foreground hidden text-right md:block">
                        {formatINR(line.unitPrice)}
                      </span>
                      <span className="text-right font-semibold">{formatINR(lineTotal)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Button asChild variant="outline">
            <Link href="/products">{t("continue")}</Link>
          </Button>
        </div>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>{t("summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>{t("items")}</dt>
                <dd>{totals.itemCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("subtotal")}</dt>
                <dd>{rupees(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t("shipping")}</dt>
                <dd>{totals.shipping === 0 ? t("free") : rupees(totals.shipping)}</dd>
              </div>
              <div className="border-border flex justify-between border-t pt-3 text-base font-bold">
                <dt>{t("total")}</dt>
                <dd className="text-brand-800">{rupees(totals.grandTotal)}</dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-xs">
              ({t("inclTax")}) · {t("shippingNote")}
            </p>
            {problems && (
              <p role="alert" className="text-danger rounded-md bg-red-50 px-3 py-2 text-sm">
                {t("fixProblems")}
              </p>
            )}
            {problems ? (
              <Button size="lg" className="w-full" disabled>
                {t("checkout")}
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">{t("checkout")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
