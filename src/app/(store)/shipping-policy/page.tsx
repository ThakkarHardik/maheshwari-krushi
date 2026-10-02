import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage, legalDoc } from "@/components/store/legal-page";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { getSetting } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await legalDoc("shipping")).title };
}

/** Reads the live delivery settings, so the policy always matches checkout. */
export default async function ShippingPolicyPage() {
  const en = (await getLocale()) === "en";
  const [shipping, cod, pincodes] = await Promise.all([
    getSetting("shipping"),
    getSetting("cod"),
    db.serviceablePincode.findMany({
      where: { isActive: true },
      orderBy: { city: "asc" },
      select: { pincode: true, city: true },
    }),
  ]);
  const list = pincodes.map((p) => `${p.city} (${p.pincode})`).join(", ");
  const deliveryArea = shipping.deliverEverywhere
    ? en
      ? "all PIN codes in India"
      : "पूरे भारत के सभी पिनकोड"
    : en
      ? `these areas: ${list}`
      : `इन क्षेत्रों: ${list}`;
  const freeAbove =
    shipping.freeShippingAbove === null
      ? ""
      : en
        ? `, free on orders of ${formatINR(shipping.freeShippingAbove)} or more`
        : `, ${formatINR(shipping.freeShippingAbove)} या उससे ज़्यादा के ऑर्डर पर मुफ़्त`;
  const codText = !cod.enabled
    ? en
      ? "Cash on Delivery is currently not available."
      : "अभी कैश ऑन डिलीवरी उपलब्ध नहीं है।"
    : en
      ? `Cash on Delivery is available on orders up to ${formatINR(cod.maxOrderValue)} (on most PIN codes).`
      : `${formatINR(cod.maxOrderValue)} तक के ऑर्डर पर कैश ऑन डिलीवरी उपलब्ध है (अधिकतर पिनकोड पर)।`;

  return (
    <LegalPage
      docKey="shipping"
      vars={{ deliveryArea, flatCharge: formatINR(shipping.flatCharge), freeAbove, cod: codText }}
    />
  );
}
