import "server-only";
import type { AdminRole, OrderStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { storeConfig } from "@/config/store";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { notify } from "@/lib/notifications";
import { eventForStatus } from "@/lib/notifications/templates";
import { financialYear, formatInvoiceNumber, invoiceCounterKey } from "./invoice";
import { canTransition, issuesInvoice, releasesStock } from "./status";

export class OrderActionError extends Error {
  constructor(
    public readonly code: "notFound" | "invalidTransition" | "conflict" | "notCod" | "alreadyCollected",
  ) {
    super(code);
  }
}

export type TransitionOptions = {
  note?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  /** On DELIVERED: cash was collected (COD). */
  codCollected?: boolean;
  /** On RETURNED: put the returned items back into sellable stock. */
  restock?: boolean;
};

async function nextInvoiceNumber(tx: Prisma.TransactionClient, now: Date) {
  const fy = financialYear(now);
  const counter = await tx.counter.upsert({
    where: { key: invoiceCounterKey(fy) },
    update: { value: { increment: 1 } },
    create: { key: invoiceCounterKey(fy), value: 1 },
  });
  return formatInvoiceNumber(storeConfig.orderNumberPrefix, fy, counter.value);
}

/** Moves an order to its next status, with all stock and payment side effects, atomically. */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  options: TransitionOptions,
  admin: { id: string; role: AdminRole },
) {
  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { allocations: true } } },
    });
    if (!order) throw new OrderActionError("notFound");
    if (!canTransition(order.status, to, admin.role)) throw new OrderActionError("invalidTransition");

    const data: Prisma.OrderUpdateManyMutationInput = { status: to };
    if (to === "SHIPPED") {
      data.courierName = options.courierName || null;
      data.trackingNumber = options.trackingNumber || null;
    }
    if (to === "DELIVERED" && order.paymentMethod === "COD" && options.codCollected) {
      data.paymentStatus = "COD_COLLECTED";
      data.codCollectedAt = now;
    }
    if (issuesInvoice(to) && !order.invoiceNumber) {
      data.invoiceNumber = await nextInvoiceNumber(tx, now);
      data.invoiceDate = now;
    }

    // Guard against two people changing the same order at once.
    const updated = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data });
    if (updated.count === 0) throw new OrderActionError("conflict");

    const putBack = releasesStock(to) || (to === "RETURNED" && options.restock);
    if (putBack) {
      for (const item of order.items) {
        for (const allocation of item.allocations) {
          await tx.inventoryBatch.update({
            where: { id: allocation.batchId },
            data: { qtyAvailable: { increment: allocation.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              batchId: allocation.batchId,
              type: to === "CANCELLED" ? "RELEASE" : "RETURN",
              quantity: allocation.quantity,
              orderId: order.id,
              reason: order.orderNumber,
              adminUserId: admin.id,
            },
          });
        }
      }
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: to,
        note: options.note || null,
        adminUserId: admin.id,
      },
    });

    return { order, putBack: Boolean(putBack), invoiceNumber: data.invoiceNumber as string | undefined };
  });

  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "order.status",
      entityType: "Order",
      entityId: orderId,
      meta: {
        from: result.order.status,
        to,
        restocked: result.putBack,
        invoiceNumber: result.invoiceNumber ?? null,
      },
    },
  });

  const event = eventForStatus(to);
  if (event) {
    await notify({
      event,
      to: result.order.shipMobile,
      audience: "CUSTOMER",
      orderId,
      vars: {
        name: result.order.shipName,
        orderNumber: result.order.orderNumber,
        total: formatINR(result.order.grandTotal),
        courier: options.courierName,
        tracking: options.trackingNumber,
      },
    });
  }
  return result;
}

/** Records cash received for a delivered COD order (if it wasn't ticked at delivery). */
export async function markCodCollected(orderId: string, adminId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true, paymentStatus: true },
  });
  if (!order) throw new OrderActionError("notFound");
  if (order.paymentMethod !== "COD") throw new OrderActionError("notCod");
  if (order.paymentStatus === "COD_COLLECTED") throw new OrderActionError("alreadyCollected");
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: "COD_COLLECTED", codCollectedAt: new Date() },
  });
  await db.auditLog.create({
    data: { adminUserId: adminId, action: "order.cod_collected", entityType: "Order", entityId: orderId },
  });
}
