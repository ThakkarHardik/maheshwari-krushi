import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { StockMovementType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type MovementRow = {
  id: string;
  createdAt: Date;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  batch: { batchNo: string } | null;
  adminUser: { name: string } | null;
  variant?: { id: string; label: string; product: { nameHi: string } };
};

/** Stock register table, shared by the per-variant page and the full register. */
export async function MovementTable({ rows, showProduct }: { rows: MovementRow[]; showProduct?: boolean }) {
  const t = await getTranslations("admin.inventory");
  const format = await getFormatter();

  if (rows.length === 0)
    return <p className="text-muted-foreground px-5 py-8 text-center">{t("noHistory")}</p>;

  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="border-border bg-brand-50 text-brand-800 border-b">
        <tr>
          <th className="px-4 py-3 font-semibold">{t("date")}</th>
          {showProduct && <th className="px-4 py-3 font-semibold">{t("product")}</th>}
          <th className="px-4 py-3 font-semibold">{t("typeCol")}</th>
          <th className="px-4 py-3 font-semibold">{t("batchNo")}</th>
          <th className="px-4 py-3 text-right font-semibold">{t("change")}</th>
          <th className="px-4 py-3 font-semibold">{t("reasonCol")}</th>
          <th className="px-4 py-3 font-semibold">{t("by")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id} className="border-border border-b last:border-0">
            <td className="text-muted-foreground px-4 py-2 whitespace-nowrap">
              {format.dateTime(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}
            </td>
            {showProduct && m.variant && (
              <td className="px-4 py-2">
                <Link href={`/admin/inventory/${m.variant.id}`} className="hover:underline">
                  {m.variant.product.nameHi} · {m.variant.label}
                </Link>
              </td>
            )}
            <td className="px-4 py-2">{t(`types.${m.type}`)}</td>
            <td className="px-4 py-2 font-mono text-xs">{m.batch?.batchNo ?? "—"}</td>
            <td
              className={cn(
                "px-4 py-2 text-right font-semibold tabular-nums",
                m.quantity > 0 ? "text-brand-700" : "text-danger",
              )}
            >
              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
            </td>
            <td className="px-4 py-2">{m.reason ?? "—"}</td>
            <td className="text-muted-foreground px-4 py-2">{m.adminUser?.name ?? t("system")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
