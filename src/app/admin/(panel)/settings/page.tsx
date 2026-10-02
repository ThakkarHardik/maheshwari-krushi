import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { getSetting } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { CodForm, PincodeForm, ShippingForm } from "./settings-forms";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ pincode?: string }>;
}) {
  await requireAdmin("settings:manage");
  const { pincode: editPincode } = await searchParams;
  const t = await getTranslations("admin.settings");

  const [shipping, cod, pincodes] = await Promise.all([
    getSetting("shipping"),
    getSetting("cod"),
    db.serviceablePincode.findMany({ orderBy: [{ isActive: "desc" }, { pincode: "asc" }] }),
  ]);
  const editing = pincodes.find((p) => p.pincode === editPincode);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("shipping")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingForm value={shipping} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("cod")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CodForm value={cod} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>{t("pincodes")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("pincodesHint")}</p>
        </CardHeader>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-border bg-brand-50 text-brand-800 border-b">
            <tr>
              <th className="px-4 py-2 font-semibold">{t("pincode")}</th>
              <th className="px-4 py-2 font-semibold">{t("city")}</th>
              <th className="px-4 py-2 font-semibold">{t("district")}</th>
              <th className="px-4 py-2 text-right font-semibold">{t("charge")}</th>
              <th className="px-4 py-2 font-semibold">{t("codAllowed")}</th>
              <th className="px-4 py-2 text-right font-semibold">{t("eta")}</th>
              <th className="px-4 py-2 font-semibold">{t("status")}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pincodes.map((p) => (
              <tr
                key={p.pincode}
                className={cn("border-border border-b last:border-0", !p.isActive && "text-muted-foreground")}
              >
                <td className="px-4 py-2 font-mono">{p.pincode}</td>
                <td className="px-4 py-2">{p.city}</td>
                <td className="px-4 py-2">{p.district ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  {p.deliveryCharge
                    ? formatINR(p.deliveryCharge)
                    : `${t("defaultCharge")} (${formatINR(shipping.flatCharge)})`}
                </td>
                <td className="px-4 py-2">{p.codAllowed ? t("yes") : t("no")}</td>
                <td className="px-4 py-2 text-right">{p.etaDays}</td>
                <td className="px-4 py-2">{p.isActive ? t("active") : "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/settings?pincode=${p.pincode}#pincode-form`}
                    className="text-brand-700 hover:underline"
                  >
                    {t("edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div id="pincode-form" className="border-border border-t px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{editing ? t("editPincode") : t("addPincode")}</h3>
            {editing && (
              <Link href="/admin/settings" className="text-brand-700 text-sm hover:underline">
                {t("cancel")}
              </Link>
            )}
          </div>
          <PincodeForm
            key={editing?.pincode ?? "new"}
            value={
              editing && {
                pincode: editing.pincode,
                city: editing.city,
                district: editing.district,
                deliveryCharge: editing.deliveryCharge?.toString() ?? null,
                codAllowed: editing.codAllowed,
                etaDays: editing.etaDays,
                isActive: editing.isActive,
              }
            }
          />
        </div>
      </Card>
    </div>
  );
}
