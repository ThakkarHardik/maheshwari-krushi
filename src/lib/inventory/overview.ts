import "server-only";
import { db } from "@/lib/db";
import { expiryStatus, stockLevel, type StockLevel } from "./rules";

export type InventoryRow = {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  isActive: boolean;
  lowStockThreshold: number;
  sellable: number;
  expiredQty: number;
  nearExpiryQty: number;
  nextExpiry: Date | null;
  level: StockLevel;
};

/** One row per pack size of every non-deleted product, with computed stock figures. */
export async function getInventoryOverview(now = new Date()): Promise<InventoryRow[]> {
  const variants = await db.productVariant.findMany({
    where: { product: { deletedAt: null } },
    orderBy: [{ product: { nameHi: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      label: true,
      sku: true,
      isActive: true,
      lowStockThreshold: true,
      product: { select: { id: true, nameHi: true } },
      batches: { where: { qtyAvailable: { gt: 0 } }, select: { qtyAvailable: true, expiryDate: true } },
    },
  });

  return variants.map((v) => {
    let sellable = 0;
    let expiredQty = 0;
    let nearExpiryQty = 0;
    let nextExpiry: Date | null = null;
    for (const b of v.batches) {
      const status = expiryStatus(b.expiryDate, now);
      if (status === "EXPIRED") {
        expiredQty += b.qtyAvailable;
        continue;
      }
      sellable += b.qtyAvailable;
      if (status === "NEAR") nearExpiryQty += b.qtyAvailable;
      if (b.expiryDate && (!nextExpiry || b.expiryDate < nextExpiry)) nextExpiry = b.expiryDate;
    }
    return {
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.nameHi,
      variantLabel: v.label,
      sku: v.sku,
      isActive: v.isActive,
      lowStockThreshold: v.lowStockThreshold,
      sellable,
      expiredQty,
      nearExpiryQty,
      nextExpiry,
      level: stockLevel(sellable, v.lowStockThreshold),
    };
  });
}

/** Counts for the dashboard and sidebar badge (active pack sizes only). */
export function summarizeInventory(rows: InventoryRow[]) {
  const active = rows.filter((r) => r.isActive);
  return {
    out: active.filter((r) => r.level === "OUT").length,
    low: active.filter((r) => r.level === "LOW").length,
    nearExpiry: active.filter((r) => r.nearExpiryQty > 0).length,
    expired: rows.filter((r) => r.expiredQty > 0).length,
  };
}
