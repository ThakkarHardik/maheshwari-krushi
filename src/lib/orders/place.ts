import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { storeConfig } from "@/config/store";
import type { CheckoutInput } from "@/lib/checkout/schema";
import { db } from "@/lib/db";
import { quoteDelivery } from "@/lib/delivery";
import { allocateFefo, type Allocation } from "@/lib/inventory/rules";
import { paiseToDecimalString, priceOrder } from "@/lib/pricing";
import { getSetting } from "@/lib/settings";

export type PlaceOrderError =
  | "emptyCart"
  | "cartChanged"
  | "outOfStock"
  | "notServiceable"
  | "invalidPincode"
  | "codUnavailable"
  | "paymentUnavailable"
  | "tooManyOrders";

export class PlaceOrderFailure extends Error {
  constructor(
    public readonly code: PlaceOrderError,
    public readonly detail?: string,
  ) {
    super(code);
  }
}

const MAX_PENDING_ORDERS_PER_HOUR = 5;

type BatchRow = { id: string; qtyAvailable: number; expiryDate: Date | null; receivedAt: Date };

/** Next order number, e.g. "MKSC10001". Atomic, so two orders never share a number. */
async function nextOrderNumber(tx: Prisma.TransactionClient) {
  const counter = await tx.counter.upsert({
    where: { key: "order" },
    update: { value: { increment: 1 } },
    create: { key: "order", value: 10001 },
  });
  return `${storeConfig.orderNumberPrefix}${counter.value}`;
}

/**
 * Turns the visitor's cart into an order: re-checks prices, stock, delivery and
 * COD rules on the server, reserves stock FEFO with row locks, and empties the cart.
 * Phase 5 accepts Cash on Delivery only; UPI/card arrive with Razorpay in Phase 6.
 */
export async function placeOrder(cartId: string, input: CheckoutInput) {
  if (input.paymentMethod !== "COD") throw new PlaceOrderFailure("paymentUnavailable");

  const recentOrders = await db.order.count({
    where: {
      shipMobile: input.mobile,
      status: "PENDING",
      placedAt: { gte: new Date(Date.now() - 3_600_000) },
    },
  });
  if (recentOrders >= MAX_PENDING_ORDERS_PER_HOUR) throw new PlaceOrderFailure("tooManyOrders");

  const [shipping, cod, pincodeRow] = await Promise.all([
    getSetting("shipping"),
    getSetting("cod"),
    db.serviceablePincode.findUnique({ where: { pincode: input.pincode } }),
  ]);

  return db.$transaction(
    async (tx) => {
      const items = await tx.cartItem.findMany({
        where: { cartId },
        orderBy: { id: "asc" },
        include: {
          variant: {
            include: {
              product: {
                select: { nameHi: true, hsnCode: true, gstRate: true, isActive: true, deletedAt: true },
              },
            },
          },
        },
      });
      if (items.length === 0) throw new PlaceOrderFailure("emptyCart");
      for (const item of items) {
        const p = item.variant.product;
        if (!item.variant.isActive || !p.isActive || p.deletedAt) {
          throw new PlaceOrderFailure("cartChanged", p.nameHi);
        }
      }

      const subtotalForQuote = priceOrder(
        items.map((i) => ({
          unitPrice: i.variant.price,
          quantity: i.quantity,
          gstRate: i.variant.product.gstRate,
        })),
        { shippingPaise: 0, intraState: true },
      ).subtotal;
      const quote = quoteDelivery(input.pincode, pincodeRow, { shipping, cod }, subtotalForQuote);
      if (!quote.ok) throw new PlaceOrderFailure(quote.reason);
      if (!quote.codAvailable) throw new PlaceOrderFailure("codUnavailable", quote.codReason ?? undefined);

      const intraState = quote.state === storeConfig.address.state;
      const totals = priceOrder(
        items.map((i) => ({
          unitPrice: i.variant.price,
          quantity: i.quantity,
          gstRate: i.variant.product.gstRate,
        })),
        { shippingPaise: quote.shippingPaise, intraState },
      );

      // Lock each pack size's batches so concurrent orders can't oversell, then allocate FEFO.
      const allocations: Allocation[][] = [];
      for (const item of items) {
        const batches = await tx.$queryRaw<BatchRow[]>`
          SELECT "id", "qtyAvailable", "expiryDate", "receivedAt"
          FROM "InventoryBatch"
          WHERE "variantId" = ${item.variantId} AND "qtyAvailable" > 0
          FOR UPDATE`;
        const allocation = allocateFefo(batches, item.quantity);
        if (!allocation) throw new PlaceOrderFailure("outOfStock", item.variant.product.nameHi);
        allocations.push(allocation);
      }

      const customer = await tx.customer.upsert({
        where: { mobile: input.mobile },
        update: { name: input.name },
        create: { name: input.name, mobile: input.mobile },
      });
      const sameAddress = await tx.address.findFirst({
        where: { customerId: customer.id, line1: input.address, pincode: input.pincode, city: input.city },
        select: { id: true },
      });
      if (!sameAddress) {
        await tx.address.create({
          data: {
            customerId: customer.id,
            fullName: input.name,
            mobile: input.mobile,
            line1: input.address,
            city: input.city,
            state: quote.state,
            pincode: input.pincode,
          },
        });
      }

      const money = paiseToDecimalString;
      const order = await tx.order.create({
        data: {
          orderNumber: await nextOrderNumber(tx),
          customerId: customer.id,
          status: "PENDING",
          paymentMethod: "COD",
          paymentStatus: "COD_PENDING",
          shipName: input.name,
          shipMobile: input.mobile,
          shipLine1: input.address,
          shipCity: input.city,
          shipState: quote.state,
          shipPincode: input.pincode,
          subtotal: money(totals.subtotal),
          shippingCharge: money(totals.shipping),
          discountTotal: money(totals.discount),
          taxableTotal: money(totals.taxable),
          cgstTotal: money(totals.cgst),
          sgstTotal: money(totals.sgst),
          igstTotal: money(totals.igst),
          grandTotal: money(totals.grandTotal),
          customerNote: input.note,
          statusHistory: { create: { toStatus: "PENDING" } },
        },
      });

      for (const [index, item] of items.entries()) {
        const line = totals.lines[index];
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            productNameHi: item.variant.product.nameHi,
            variantLabel: item.variant.label,
            sku: item.variant.sku,
            hsnCode: item.variant.product.hsnCode,
            quantity: item.quantity,
            unitPrice: item.variant.price,
            mrp: item.variant.mrp,
            gstRate: item.variant.product.gstRate,
            taxableValue: money(line.taxable),
            cgst: money(line.cgst),
            sgst: money(line.sgst),
            igst: money(line.igst),
            lineTotal: money(line.lineTotal),
          },
        });
        for (const a of allocations[index]) {
          const updated = await tx.inventoryBatch.updateMany({
            where: { id: a.batchId, qtyAvailable: { gte: a.quantity } },
            data: { qtyAvailable: { decrement: a.quantity } },
          });
          if (updated.count === 0) throw new PlaceOrderFailure("outOfStock", item.variant.product.nameHi);
          await tx.orderItemBatch.create({
            data: { orderItemId: orderItem.id, batchId: a.batchId, quantity: a.quantity },
          });
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              batchId: a.batchId,
              type: "RESERVE",
              quantity: -a.quantity,
              orderId: order.id,
              reason: order.orderNumber,
            },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId } });
      return { orderId: order.id, orderNumber: order.orderNumber, grandTotal: totals.grandTotal };
    },
    { timeout: 15_000 },
  );
}
