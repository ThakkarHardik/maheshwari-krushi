import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { StockMovementType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MovementTable } from "../movement-table";

const TYPES: StockMovementType[] = [
  "PURCHASE",
  "SALE",
  "RESERVE",
  "RELEASE",
  "RETURN",
  "DAMAGE",
  "ADJUSTMENT",
];

export default async function MovementsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireAdmin("inventory:manage");
  const { type: typeParam } = await searchParams;
  const type = TYPES.find((ty) => ty === typeParam);
  const t = await getTranslations("admin.inventory");

  const rows = await db.stockMovement.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      batch: { select: { batchNo: true } },
      adminUser: { select: { name: true } },
      variant: { select: { id: true, label: true, product: { select: { nameHi: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/inventory" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("movementsTitle")}</h1>
        <p className="text-muted-foreground">{t("movementsSubtitle")}</p>
      </div>
      <form className="flex gap-2">
        <Select name="type" defaultValue={type ?? ""} className="h-10 max-w-xs">
          <option value="">{t("allTypes")}</option>
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`types.${ty}`)}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline" size="sm" className="h-10">
          {t("filter")}
        </Button>
      </form>
      <Card className="overflow-x-auto">
        <MovementTable rows={rows} showProduct />
      </Card>
    </div>
  );
}
