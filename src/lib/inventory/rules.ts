/** Pure stock rules — no database access, fully unit-tested. */

export const NEAR_EXPIRY_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpiryStatus = "EXPIRED" | "NEAR" | "OK" | "NONE";
export type StockLevel = "OUT" | "LOW" | "OK";

export function expiryStatus(expiryDate: Date | null, now = new Date()): ExpiryStatus {
  if (!expiryDate) return "NONE";
  if (expiryDate <= now) return "EXPIRED";
  if (expiryDate.getTime() - now.getTime() <= NEAR_EXPIRY_DAYS * DAY_MS) return "NEAR";
  return "OK";
}

export function stockLevel(sellable: number, lowStockThreshold: number): StockLevel {
  if (sellable <= 0) return "OUT";
  if (sellable <= lowStockThreshold) return "LOW";
  return "OK";
}

export type BatchForAllocation = {
  id: string;
  qtyAvailable: number;
  expiryDate: Date | null;
  receivedAt: Date;
};

export type Allocation = { batchId: string; quantity: number };

/**
 * FEFO (first expiry, first out): takes `quantity` units from unexpired batches,
 * earliest expiry first; batches without an expiry date go last, oldest received
 * first. Returns null when there isn't enough sellable stock.
 */
export function allocateFefo(
  batches: readonly BatchForAllocation[],
  quantity: number,
  now = new Date(),
): Allocation[] | null {
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  const usable = batches
    .filter((b) => b.qtyAvailable > 0 && (!b.expiryDate || b.expiryDate > now))
    .sort((a, b) => {
      const ea = a.expiryDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const eb = b.expiryDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return ea - eb || a.receivedAt.getTime() - b.receivedAt.getTime();
    });

  const allocations: Allocation[] = [];
  let remaining = quantity;
  for (const batch of usable) {
    if (remaining === 0) break;
    const take = Math.min(batch.qtyAvailable, remaining);
    allocations.push({ batchId: batch.id, quantity: take });
    remaining -= take;
  }
  return remaining === 0 ? allocations : null;
}

export const ADJUSTMENT_TYPES = ["DAMAGE", "RETURN", "ADJUSTMENT"] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

/**
 * Signed stock change for a manual adjustment. DAMAGE always removes and RETURN
 * always adds (enter a positive number); ADJUSTMENT takes the sign as entered.
 */
export function adjustmentDelta(type: AdjustmentType, quantity: number): number {
  if (type === "DAMAGE") return -Math.abs(quantity);
  if (type === "RETURN") return Math.abs(quantity);
  return quantity;
}
