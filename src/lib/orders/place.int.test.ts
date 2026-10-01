import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CheckoutInput } from "@/lib/checkout/schema";
import { db } from "@/lib/db";
import { PlaceOrderFailure, placeOrder } from "./place";

/**
 * Runs against the real database (npm run test:int). Creates its own product,
 * stock and carts, and removes everything it created afterwards.
 */
const tag = `itest-${randomBytes(4).toString("hex")}`;
let variantId = "";
let productId = "";
const cartIds: string[] = [];
const mobiles = ["9000000001", "9000000002", "9000000003"];

const checkout = (mobile: string): CheckoutInput => ({
  name: "टेस्ट ग्राहक",
  mobile,
  address: "टेस्ट पता, वार्ड 1, सैलाना",
  city: "Sailana",
  pincode: "457550",
  paymentMethod: "COD",
  note: null,
});

async function cartWith(quantity: number) {
  const cart = await db.cart.create({
    data: { guestToken: randomBytes(24).toString("hex"), items: { create: { variantId, quantity } } },
  });
  cartIds.push(cart.id);
  return cart.id;
}

beforeAll(async () => {
  const category = await db.category.findFirstOrThrow({ where: { isActive: true } });
  const product = await db.product.create({
    data: {
      slug: tag,
      nameHi: `टेस्ट उत्पाद ${tag}`,
      hsnCode: "3101",
      gstRate: "5",
      categoryId: category.id,
      minPrice: "100",
      variants: {
        create: {
          sku: tag.toUpperCase(),
          label: "1 किलो",
          packSize: "1",
          unit: "KG",
          mrp: "120",
          price: "100",
        },
      },
    },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0].id;
  const day = 24 * 60 * 60 * 1000;
  // Two batches: the later-expiring one was received first, to prove FEFO ignores receipt order.
  await db.inventoryBatch.createMany({
    data: [
      {
        variantId,
        batchNo: "LATE",
        qtyReceived: 2,
        qtyAvailable: 2,
        expiryDate: new Date(Date.now() + 300 * day),
      },
      {
        variantId,
        batchNo: "SOON",
        qtyReceived: 2,
        qtyAvailable: 2,
        expiryDate: new Date(Date.now() + 90 * day),
      },
    ],
  });
});

afterAll(async () => {
  const orders = await db.order.findMany({ where: { items: { some: { variantId } } }, select: { id: true } });
  await db.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  await db.stockMovement.deleteMany({ where: { variantId } });
  await db.inventoryBatch.deleteMany({ where: { variantId } });
  await db.cart.deleteMany({ where: { id: { in: cartIds } } });
  await db.product.delete({ where: { id: productId } });
  await db.customer.deleteMany({ where: { mobile: { in: mobiles } } });
  await db.$disconnect();
});

describe("placeOrder", () => {
  // On real PostgreSQL both orders run truly in parallel and row locks decide the winner.
  // With DATABASE_POOL_MAX=1 (local PGlite) they queue, which still proves the stock rules.
  it("never oversells when two customers order the last units at the same time", async () => {
    const [cartA, cartB] = await Promise.all([cartWith(3), cartWith(3)]);

    const results = await Promise.allSettled([
      placeOrder(cartA, checkout(mobiles[0])),
      placeOrder(cartB, checkout(mobiles[1])),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(PlaceOrderFailure);
    expect((rejected[0].reason as PlaceOrderFailure).code).toBe("outOfStock");

    const batches = await db.inventoryBatch.findMany({ where: { variantId }, orderBy: { batchNo: "asc" } });
    expect(batches.map((b) => [b.batchNo, b.qtyAvailable])).toEqual([
      ["LATE", 1], // FEFO: SOON (2) used first, then 1 from LATE
      ["SOON", 0],
    ]);
    expect(batches.every((b) => b.qtyAvailable >= 0)).toBe(true);
  });

  it("stores prices, GST, allocations and stock movements, and empties the cart", async () => {
    const order = await db.order.findFirstOrThrow({
      where: { items: { some: { variantId } } },
      include: { items: { include: { allocations: true } }, stockMovements: true, statusHistory: true },
    });
    expect(order.orderNumber).toMatch(/^MKSC\d+$/);
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("COD_PENDING");
    expect(order.shipState).toBe("Madhya Pradesh");
    // 3 × ₹100 incl. 5% GST + ₹60 shipping
    expect(order.subtotal.toString()).toBe("300");
    expect(order.shippingCharge.toString()).toBe("60");
    expect(order.grandTotal.toString()).toBe("360");
    expect(order.taxableTotal.toString()).toBe("285.71");
    expect(order.cgstTotal.plus(order.sgstTotal).toString()).toBe("14.29");
    expect(order.igstTotal.toString()).toBe("0");

    expect(order.items[0].allocations.reduce((s, a) => s + a.quantity, 0)).toBe(3);
    expect(order.stockMovements.every((m) => m.type === "RESERVE" && m.quantity < 0)).toBe(true);
    expect(order.stockMovements.reduce((s, m) => s + m.quantity, 0)).toBe(-3);
    expect(order.statusHistory).toHaveLength(1);

    const emptied = await db.cartItem.count({ where: { cartId: { in: cartIds } } });
    expect(emptied).toBe(1); // only the failed cart still has its item
  });

  it("rejects an unserviceable PIN code and keeps the cart", async () => {
    const cart = await cartWith(1);
    await expect(placeOrder(cart, { ...checkout(mobiles[2]), pincode: "400001" })).rejects.toMatchObject({
      code: "notServiceable",
    });
    expect(await db.cartItem.count({ where: { cartId: cart } })).toBe(1);
  });

  it("only accepts Cash on Delivery until online payments are live", async () => {
    const cart = await cartWith(1);
    await expect(placeOrder(cart, { ...checkout(mobiles[2]), paymentMethod: "UPI" })).rejects.toMatchObject({
      code: "paymentUnavailable",
    });
  });
});
