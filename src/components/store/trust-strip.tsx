import { BadgeCheck, Leaf, ShieldCheck, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function TrustStrip() {
  const t = await getTranslations("trust");
  const items = [
    { icon: ShieldCheck, label: t("securePayment") },
    { icon: Leaf, label: t("quality") },
    { icon: Truck, label: t("fastDelivery") },
    { icon: BadgeCheck, label: t("trust") },
  ];
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="text-brand-800 flex items-center justify-center gap-2 text-sm font-medium">
          <Icon className="text-brand-600 size-5" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
