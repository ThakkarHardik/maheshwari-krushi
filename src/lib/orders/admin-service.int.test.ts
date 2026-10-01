import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { OrderActionError, transitionOrder } from "./admin-service";
import { financialYear } from "./invoice";
import { placeOrder } from "./place";

/** Order status changes against the real database (npm run test:int). Cleans up after itself. */
const tag = `itest-${randomBytes(4).toString("hex")}`;
const mobile = "9000000011";
let variantId = "";
let productId = "";
let ownerId = "";
let packerId = "";
const cartIds: string[] = [];

async function newOrder(quantity: number) {
  const cart = await db.cart.create({
    data: { guestToken: randomBytes(24).toString("hex"), items: { create: { variantId, quantity } } },
  });
  cartIds.push(cart.id);
  return placeOrder(cart.id, {
    name: "टेस्ट ग्राहक",
    mobile,
    address: "टेस्ट पता, वार्ड 1, सैलाना",
    city: "Sailana",
    pincode: "457550",
    paymentMethod: "COD",
    note: null,
  });
}

const stock = async () =>
  (await db.inventoryBatch.aggregate({ where: { variantId }, _sum: { qtyAvailable: true } }))._sum
    .qtyAvailable;

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
  await db.inventoryBatch.create({ data: { variantId, batchNo: "B1", qtyReceived: 10, qtyAvailable: 10 } });
  const hash = "$2b$12$.itmNiIwXhfaBm08L8rn4Ob351M8./FLDZYN7RFU/MMZ/4u8sEP4O";
  ownerId = (
    await db.adminUser.create({
      data: { name: "IT Owner", email: `${tag}-o@test.local`, role: "OWNER", passwordHash: hash },
    })
  ).id;
  packerId = (
    await db.adminUser.create({
      data: { name: "IT Packer", email: `${tag}-p@test.local`, role: "PACKER", passwordHash: hash },
    })
  ).id;
});

afterAll(async () => {
  const orders = await db.order.findMany({ where: { items: { some: { variantId } } }, select: { id: true } });
  const ids = orders.map((o) => o.id);
  await db.auditLog.deleteMany({ where: { entityId: { in: ids } } });
  await db.order.deleteMany({ where: { id: { in: ids } } });
  await db.stockMovement.deleteMany({ where: { variantId } });
  await db.inventoryBatch.deleteMany({ where: { variantId } });
  await db.cart.deleteMany({ where: { id: { in: cartIds } } });
  await db.product.delete({ where: { id: productId } });
  await db.customer.deleteMany({ where: { mobile } });
  await db.adminUser.deleteMany({ where: { id: { in: [ownerId, packerId] } } });
  await db.$disconnect();
});

describe("transitionOrder", () => {
  it("walks an order to delivered, issuing an invoice number at packing and recording cash", async () => {
    const { orderId } = await newOrder(2);
    const owner = { id: ownerId, role: "OWNER" as const };
    const packer = { id: packerId, role: "PACKER" as const };

    await transitionOrder(orderId, "CONFIRMED", { note: "फ़ोन पर पुष्टि" }, owner);
    await transitionOrder(orderId, "PACKED", {}, packer);
    await transitionOrder(orderId, "SHIPPED", { courierName: "Local", trackingNumber: "T-1" }, packer);
    await transitionOrder(orderId, "DELIVERED", { codCollected: true }, packer);

    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { statusHistory: true, notifications: true },
    });
    expect(order.status).toBe("DELIVERED");
    expect(order.invoiceNumber).toMatch(new RegExp(`^MKSC/${financialYear(new Date())}/\\d{4,}$`));
    expect(order.courierName).toBe("Local");
    expect(order.paymentStatus).toBe("COD_COLLECTED");
    expect(order.codCollectedAt).not.toBeNull();
    expect(order.statusHistory.map((h) => h.toStatus)).toEqual([
      "PENDING",
      "CONFIRMED",
      "PACKED",
      "SHIPPED",
      "DELIVERED",
    ]);
    // Customer messages are queued (manual WhatsApp mode): confirmed, shipped, delivered.
    expect(order.notifications.map((n) => n.template).sort()).toEqual(
      ["ORDER_CONFIRMED", "ORDER_DELIVERED", "ORDER_SHIPPED"].sort(),
    );
    expect(order.notifications.every((n) => n.status === "QUEUED" && n.recipient === mobile)).toBe(true);
  });

  it("gives consecutive invoice numbers", async () => {
    const owner = { id: ownerId, role: "OWNER" as const };
    const numbers: number[] = [];
    for (let i = 0; i < 2; i++) {
      const { orderId } = await newOrder(1);
      await transitionOrder(orderId, "CONFIRMED", {}, owner);
      await transitionOrder(orderId, "PACKED", {}, owner);
      const { invoiceNumber } = await db.order.findUniqueOrThrow({ where: { id: orderId } });
      numbers.push(Number(invoiceNumber!.split("/")[2]));
    }
    expect(numbers[1]).toBe(numbers[0] + 1);
  });

  it("releases reserved stock on cancel, and restocks returns only when asked", async () => {
    const owner = { id: ownerId, role: "OWNER" as const };
    const before = await stock();

    const { orderId: cancelled } = await newOrder(3);
    expect(await stock()).toBe(before! - 3);
    await transitionOrder(cancelled, "CANCELLED", { note: "ग्राहक ने मना किया" }, owner);
    expect(await stock()).toBe(before);
    const release = await db.stockMovement.findMany({ where: { orderId: cancelled, type: "RELEASE" } });
    expect(release.reduce((s, m) => s + m.quantity, 0)).toBe(3);

    const { orderId: returned } = await newOrder(1);
    for (const to of ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const)
      await transitionOrder(returned, to, {}, owner);
    await transitionOrder(returned, "RETURNED", { restock: true }, owner);
    expect(await stock()).toBe(before);

    const { orderId: damaged } = await newOrder(1);
    for (const to of ["CONFIRMED", "PACKED", "SHIPPED"] as const)
      await transitionOrder(damaged, to, {}, owner);
    await transitionOrder(damaged, "RETURNED", { restock: false }, owner);
    expect(await stock()).toBe(before! - 1);
  });

  it("refuses invalid or unauthorised changes", async () => {
    const { orderId } = await newOrder(1);
    await expect(
      transitionOrder(orderId, "SHIPPED", {}, { id: ownerId, role: "OWNER" }),
    ).rejects.toBeInstanceOf(OrderActionError);
    await expect(
      transitionOrder(orderId, "CANCELLED", {}, { id: packerId, role: "PACKER" }),
    ).rejects.toMatchObject({
      code: "invalidTransition",
    });
  });
});
