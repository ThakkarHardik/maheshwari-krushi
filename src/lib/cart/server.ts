import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { sellableQuantity } from "@/lib/catalog/stock";
import { db } from "@/lib/db";
import { priceOrder, toPaise } from "@/lib/pricing";
import { getSetting } from "@/lib/settings";

export const CART_COOKIE = "mk_cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const MAX_LINE_QTY = 99;

async function readToken() {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  return token && /^[a-f0-9]{48}$/.test(token) ? token : null;
}

/** For server actions only: returns the visitor's cart, creating it (and the cookie) if needed. */
export async function ensureCart() {
  const token = await readToken();
  if (token) {
    const cart = await db.cart.findUnique({ where: { guestToken: token }, select: { id: true } });
    if (cart) return cart;
  }
  const guestToken = randomBytes(24).toString("hex");
  const cart = await db.cart.create({ data: { guestToken }, select: { id: true } });
  const store = await cookies();
  store.set(CART_COOKIE, guestToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
  return cart;
}

const cartItemInclude = {
  variant: {
    select: {
      id: true,
      label: true,
      sku: true,
      mrp: true,
      price: true,
      isActive: true,
      batches: { where: { qtyAvailable: { gt: 0 } }, select: { qtyAvailable: true, expiryDate: true } },
      product: {
        select: {
          id: true,
          slug: true,
          nameHi: true,
          nameEn: true,
          gstRate: true,
          hsnCode: true,
          isActive: true,
          deletedAt: true,
          images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
        },
      },
    },
  },
} as const;

export type CartLine = {
  itemId: string;
  variantId: string;
  productId: string;
  slug: string;
  nameHi: string;
  nameEn: string | null;
  label: string;
  sku: string;
  hsnCode: string;
  imageUrl: string | null;
  unitPrice: string;
  mrp: string;
  gstRate: string;
  quantity: number;
  stock: number;
  /** Product or pack size no longer sold. */
  unavailable: boolean;
};

/** The visitor's cart with live prices and stock. Read-only: never creates a cart. */
export const getCart = cache(async () => {
  const token = await readToken();
  const cart = token
    ? await db.cart.findUnique({
        where: { guestToken: token },
        include: { items: { orderBy: { id: "asc" }, include: cartItemInclude } },
      })
    : null;

  const lines: CartLine[] = (cart?.items ?? []).map((item) => {
    const v = item.variant;
    const p = v.product;
    return {
      itemId: item.id,
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      nameHi: p.nameHi,
      nameEn: p.nameEn,
      label: v.label,
      sku: v.sku,
      hsnCode: p.hsnCode,
      imageUrl: p.images[0]?.url ?? null,
      unitPrice: v.price.toString(),
      mrp: v.mrp.toString(),
      gstRate: p.gstRate.toString(),
      quantity: item.quantity,
      stock: sellableQuantity(v.batches),
      unavailable: !v.isActive || !p.isActive || p.deletedAt !== null,
    };
  });

  const purchasable = lines.filter((l) => !l.unavailable);
  const shipping = await getSetting("shipping");
  const totals = priceOrder(
    purchasable.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity, gstRate: l.gstRate })),
    { shippingPaise: purchasable.length ? toPaise(shipping.flatCharge) : 0, intraState: true },
  );
  const problems = lines.some((l) => l.unavailable || l.quantity > l.stock);

  return { cartId: cart?.id ?? null, lines, totals, problems };
});

export async function getCartCount(): Promise<number> {
  const token = await readToken();
  if (!token) return 0;
  const result = await db.cartItem.aggregate({
    where: { cart: { guestToken: token } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function clearCartCookie() {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
