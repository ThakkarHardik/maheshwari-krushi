type BatchLike = { qtyAvailable: number; expiryDate: Date | null };

export function totalAvailable(batches: readonly BatchLike[]): number {
  return batches.reduce((sum, b) => sum + Math.max(0, b.qtyAvailable), 0);
}

/**
 * Expiry date of the batch that will be sold next (FEFO: first expiry, first
 * out) among batches that still have stock and have not expired.
 */
export function nextExpiry(batches: readonly BatchLike[], now = new Date()): Date | null {
  const dates = batches
    .filter((b) => b.qtyAvailable > 0 && b.expiryDate && b.expiryDate > now)
    .map((b) => b.expiryDate as Date)
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0] ?? null;
}

/** Sellable stock: only batches that are not expired. */
export function sellableQuantity(batches: readonly BatchLike[], now = new Date()): number {
  return totalAvailable(batches.filter((b) => !b.expiryDate || b.expiryDate > now));
}
