import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TrustStrip } from "@/components/store/trust-strip";
import { storeConfig } from "@/config/store";
import { getCart } from "@/lib/cart/server";
import { getSetting } from "@/lib/settings";
import { CheckoutForm } from "./checkout-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage() {
  const [{ lines, totals, problems }, cod] = await Promise.all([getCart(), getSetting("cod")]);
  if (lines.length === 0 || problems) redirect("/cart");
  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/cart" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>
      <h1 className="text-brand-800 mt-2 mb-6 text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <CheckoutForm
        subtotalPaise={totals.subtotal}
        defaultShippingPaise={totals.shipping}
        itemCount={totals.itemCount}
        codMaxValue={cod.maxOrderValue}
        whatsapp={storeConfig.whatsapp}
      />
      <div className="border-border bg-brand-50 rounded-card mt-8 border px-4 py-5">
        <TrustStrip />
      </div>
    </div>
  );
}
