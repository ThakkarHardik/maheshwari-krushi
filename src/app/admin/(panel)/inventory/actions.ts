"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adjustStockSchema, receiveStockSchema } from "@/lib/inventory/schemas";
import { adjustStock, receiveStock, StockError } from "@/lib/inventory/service";

export type StockFormState = { ok?: boolean; errors?: Record<string, string> };

function toErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
  }
  return out;
}

async function revalidateStock(variantId: string) {
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${variantId}`);
  revalidatePath("/admin");
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { product: { select: { id: true, slug: true } } },
  });
  if (variant) {
    revalidatePath(`/admin/products/${variant.product.id}`);
    revalidatePath(`/products/${variant.product.slug}`);
  }
}

export async function receiveStockAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const admin = await requireAdmin("inventory:manage");
  const parsed = receiveStockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: toErrors(parsed.error.issues) };

  try {
    const batch = await receiveStock(parsed.data, admin.id);
    await writeAudit({
      adminUserId: admin.id,
      action: "stock.receive",
      entityType: "InventoryBatch",
      entityId: batch.id,
      meta: { variantId: parsed.data.variantId, batchNo: batch.batchNo, quantity: parsed.data.quantity },
    });
  } catch (error) {
    if (error instanceof StockError) {
      return { errors: error.code === "batchExists" ? { batchNo: "batchExists" } : { _form: error.code } };
    }
    throw error;
  }
  await revalidateStock(parsed.data.variantId);
  return { ok: true };
}

export async function adjustStockAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const admin = await requireAdmin("inventory:manage");
  const parsed = adjustStockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: toErrors(parsed.error.issues) };

  try {
    const result = await adjustStock(parsed.data, admin.id);
    await writeAudit({
      adminUserId: admin.id,
      action: "stock.adjust",
      entityType: "InventoryBatch",
      entityId: parsed.data.batchId,
      meta: { type: parsed.data.type, delta: result.delta, reason: parsed.data.reason },
    });
    await revalidateStock(result.variantId);
  } catch (error) {
    if (error instanceof StockError) {
      return { errors: error.code === "insufficient" ? { quantity: "insufficient" } : { _form: error.code } };
    }
    throw error;
  }
  return { ok: true };
}
