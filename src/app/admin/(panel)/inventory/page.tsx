import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { getInventoryOverview, summarizeInventory, type InventoryRow } from "@/lib/inventory/overview";
import { expiryStatus } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";
import { ExpiryBadge, LevelBadge } from "./badges";

const FILTERS = ["all", "low", "out", "near", "expired"] as const;
type Filter = (typeof FILTERS)[number];

const MATCHES: Record<Filter, (r: InventoryRow) => boolean> = {
  all: () => true,
  low: (r) => r.isActive && r.level === "LOW",
  out: (r) => r.isActive && r.level === "OUT",
  near: (r) => r.nearExpiryQty > 0,
  expired: (r) => r.expiredQty > 0,
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireAdmin("inventory:manage");
  const { filter: filterParam, q } = await searchParams;
  const filter: Filter = FILTERS.find((f) => f === filterParam) ?? "all";
  const t = await getTranslations("admin.inventory");
  const format = await getFormatter();

  const rows = await getInventoryOverview();
  const summary = summarizeInventory(rows);
  const counts: Record<Filter, number> = {
    all: rows.length,
    low: summary.low,
    out: summary.out,
    near: summary.nearExpiry,
    expired: summary.expired,
  };
  const query = q?.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      MATCHES[filter](r) &&
      (!query || r.productName.toLowerCase().includes(query) || r.sku.toLowerCase().includes(query)),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-brand-800 text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/admin/inventory/movements" className="text-brand-700 text-sm hover:underline">
          {t("movementsLink")}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap gap-2" aria-label={t("level")}>
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/admin/inventory" : `/admin/inventory?filter=${f}`}
              aria-current={f === filter ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium",
                f === filter
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-border hover:bg-brand-50 bg-white",
              )}
            >
              {t(`filters.${f}`)} <span className="opacity-75">({counts[f]})</span>
            </Link>
          ))}
        </nav>
        <form className="ml-auto flex gap-2" role="search">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Input name="q" defaultValue={q} placeholder={t("search")} className="h-10 w-56" />
          <Button type="submit" variant="outline" size="sm" className="h-10">
            {t("filter")}
          </Button>
        </form>
      </div>

      <Card className="overflow-x-auto">
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-5 py-10 text-center">{t("empty")}</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-border bg-brand-50 text-brand-800 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("product")}</th>
                <th className="px-4 py-3 font-semibold">{t("pack")}</th>
                <th className="px-4 py-3 font-semibold">{t("sku")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("sellable")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("expiredQty")}</th>
                <th className="px-4 py-3 font-semibold">{t("nextExpiry")}</th>
                <th className="px-4 py-3 font-semibold">{t("level")}</th>
                <th className="px-4 py-3">
                  <span className="sr-only">{t("manage")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const expiry = expiryStatus(r.nextExpiry);
                return (
                  <tr key={r.variantId} className="border-border hover:bg-muted border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.productName}</td>
                    <td className="px-4 py-3">{r.variantLabel}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.sku}</td>
                    <td className="px-4 py-3 text-right text-base font-semibold">{r.sellable}</td>
                    <td
                      className={cn("px-4 py-3 text-right", r.expiredQty > 0 && "text-danger font-semibold")}
                    >
                      {r.expiredQty || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.nextExpiry ? (
                        <span className="flex items-center gap-2">
                          {format.dateTime(r.nextExpiry, { dateStyle: "medium" })}
                          {expiry === "NEAR" && <ExpiryBadge status={expiry} label={t(`expiry.${expiry}`)} />}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.isActive ? (
                        <LevelBadge level={r.level} label={t(`levels.${r.level}`)} />
                      ) : (
                        <span className="text-muted-foreground text-xs">{t("inactive")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/inventory/${r.variantId}`}
                        className="text-brand-700 whitespace-nowrap hover:underline"
                      >
                        {t("manage")} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
