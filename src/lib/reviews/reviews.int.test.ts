import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { transitionOrder } from "@/lib/orders/admin-service";
import { placeOrder } from "@/lib/orders/place";
import { isVerifiedBuyer, recomputeRating } from "./service";

/** Review rules against the real database (npm run test:int). Cleans up after itself. */
const tag = `itest-${randomBytes(4).toString("hex")}`;
const buyer = "9000000021";
const stranger = "9000000022";
let productId = "";
let variantId = "";
let ownerId = "";
const cartIds: string[] = [];

beforeAll(async () => {
  const category = await db.category.findFirstOrThrow({ where: { isActive: true } });
  const product = await db.product.create({
    data: {
      slug: tag,
      nameHi: `टेस्ट ${tag}`,
      hsnCode: "1209",
      gstRate: "0",
      categoryId: category.id,
      minPrice: "100",
      variants: {
        create: {
          sku: tag.toUpperCase(),
          label: "1 किलो",
          packSize: "1",
          unit: "KG",
          mrp: "100",
          price: "100",
        },
      },
    },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0].id;
  await db.inventoryBatch.create({ data: { variantId, batchNo: "B1", qtyReceived: 5, qtyAvailable: 5 } });
  ownerId = (
    await db.adminUser.create({
      data: { name: "IT Owner", email: `${tag}@test.local`, role: "OWNER", passwordHash: "x" },
    })
  ).id;
});

afterAll(async () => {
  const orders = await db.order.findMany({ where: { items: { some: { variantId } } }, select: { id: true } });
  await db.auditLog.deleteMany({ where: { entityId: { in: orders.map((o) => o.id) } } });
  await db.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  await db.stockMovement.deleteMany({ where: { variantId } });
  await db.inventoryBatch.deleteMany({ where: { variantId } });
  await db.cart.deleteMany({ where: { id: { in: cartIds } } });
  await db.product.delete({ where: { id: productId } }); // cascades reviews
  await db.customer.deleteMany({ where: { mobile: { in: [buyer, stranger] } } });
  await db.adminUser.delete({ where: { id: ownerId } });
  await db.$disconnect();
});

describe("reviews", () => {
  it("only counts customers with a delivered order of the product as buyers", async () => {
    const cart = await db.cart.create({
      data: { guestToken: randomBytes(24).toString("hex"), items: { create: { variantId, quantity: 1 } } },
    });
    cartIds.push(cart.id);
    const { orderId } = await placeOrder(cart.id, {
      name: "खरीदार",
      mobile: buyer,
      address: "टेस्ट पता, वार्ड 1, सैलाना",
      city: "Sailana",
      pincode: "457550",
      paymentMethod: "COD",
      note: null,
    });
    expect(await isVerifiedBuyer(productId, buyer)).toBe(false); // not delivered yet

    const owner = { id: ownerId, role: "OWNER" as const };
    for (const to of ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const)
      await transitionOrder(orderId, to, {}, owner);

    expect(await isVerifiedBuyer(productId, buyer)).toBe(true);
    expect(await isVerifiedBuyer(productId, stranger)).toBe(false);
  });

  it("computes the star rating from approved reviews only", async () => {
    await db.review.createMany({
      data: [
        { productId, name: "a", rating: 5, status: "APPROVED" },
        { productId, name: "b", rating: 4, status: "APPROVED" },
        { productId, name: "c", rating: 1, status: "PENDING" },
        { productId, name: "d", rating: 1, status: "HIDDEN" },
      ],
    });
    await recomputeRating(productId);
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.ratingCount).toBe(2);
    expect(product.ratingAvg.toString()).toBe("4.5");
  });
});
