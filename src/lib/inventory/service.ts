import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { adjustmentDelta } from "./rules";
import type { AdjustStockInput, ReceiveStockInput } from "./schemas";

export class StockError extends Error {
  constructor(public readonly code: "batchExists" | "insufficient" | "notFound") {
    super(code);
  }
}

/** Records a stock purchase as a new batch plus a PURCHASE movement, atomically. */
export async function receiveStock(input: ReceiveStockInput, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      select: { id: true },
    });
    if (!variant) throw new StockError("notFound");

    const existing = await tx.inventoryBatch.findUnique({
      where: { variantId_batchNo: { variantId: input.variantId, batchNo: input.batchNo } },
      select: { id: true },
    });
    if (existing) throw new StockError("batchExists");

    const batch = await tx.inventoryBatch.create({
      data: {
        variantId: input.variantId,
        batchNo: input.batchNo,
        qtyReceived: input.quantity,
        qtyAvailable: input.quantity,
        mfgDate: input.mfgDate,
        expiryDate: input.expiryDate,
        costPrice: input.costPrice,
        supplier: input.supplier,
      },
    });
    await tx.stockMovement.create({
      data: {
        variantId: input.variantId,
        batchId: batch.id,
        type: "PURCHASE",
        quantity: input.quantity,
        reason: input.supplier, // the movement type already says "purchase"
        adminUserId,
      },
    });
    return batch;
  });
}

/**
 * Applies a manual DAMAGE / RETURN / ADJUSTMENT to one batch. The decrement is a
 * conditional update, so two people adjusting at once can never push stock below 0.
 */
export async function adjustStock(input: AdjustStockInput, adminUserId: string) {
  const delta = adjustmentDelta(input.type, input.quantity);
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const batch = await tx.inventoryBatch.findUnique({
      where: { id: input.batchId },
      select: { id: true, variantId: true },
    });
    if (!batch) throw new StockError("notFound");

    const updated = await tx.inventoryBatch.updateMany({
      where: { id: batch.id, ...(delta < 0 ? { qtyAvailable: { gte: -delta } } : {}) },
      data: { qtyAvailable: { increment: delta } },
    });
    if (updated.count === 0) throw new StockError("insufficient");

    await tx.stockMovement.create({
      data: {
        variantId: batch.variantId,
        batchId: batch.id,
        type: input.type,
        quantity: delta,
        reason: input.reason,
        adminUserId,
      },
    });
    return { variantId: batch.variantId, delta };
  });
}
