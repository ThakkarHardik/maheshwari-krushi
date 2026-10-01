"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sellableQuantity } from "@/lib/catalog/stock";
import { db } from "@/lib/db";
import { CART_COOKIE, ensureCart, MAX_LINE_QTY } from "./server";
import { cookies } from "next/headers";

export type CartActionResult = {
  ok: boolean;
  error?: "unavailable" | "outOfStock" | "limited";
  available?: number;
};

const addSchema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(MAX_LINE_QTY),
  buyNow: z.boolean().optional(),
});

async function sellableVariant(variantId: string) {
  const variant = await db.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { isActive: true, deletedAt: null } },
    select: {
      id: true,
      batches: { where: { qtyAvailable: { gt: 0 } }, select: { qtyAvailable: true, expiryDate: true } },
    },
  });
  return variant ? { id: variant.id, stock: sellableQuantity(variant.batches) } : null;
}

function revalidateCart() {
  revalidatePath("/", "layout"); // header cart count
}

/** Adds to cart (or increases quantity). With buyNow, goes straight to checkout. */
export async function addToCartAction(input: z.input<typeof addSchema>): Promise<CartActionResult> {
  const { variantId, quantity, buyNow } = addSchema.parse(input);
  const variant = await sellableVariant(variantId);
  if (!variant) return { ok: false, error: "unavailable" };
  if (variant.stock <= 0) return { ok: false, error: "outOfStock" };

  const cart = await ensureCart();
  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    select: { quantity: true },
  });
  // Buy Now sets the quantity chosen on the page; Add to Cart adds to what's there.
  const wanted = buyNow ? quantity : (existing?.quantity ?? 0) + quantity;
  const finalQty = Math.min(wanted, variant.stock, MAX_LINE_QTY);

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: finalQty },
    create: { cartId: cart.id, variantId, quantity: finalQty },
  });
  revalidateCart();

  if (buyNow) redirect("/checkout");
  return finalQty < wanted ? { ok: true, error: "limited", available: finalQty } : { ok: true };
}

async function ownItem(itemId: string) {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return null;
  return db.cartItem.findFirst({
    where: { id: itemId, cart: { guestToken: token } },
    select: { id: true, variantId: true },
  });
}

const updateSchema = z.object({
  itemId: z.string().min(1).max(40),
  quantity: z.number().int().min(0).max(MAX_LINE_QTY),
});

/** Sets a cart line's quantity (0 removes it), capped at available stock. */
export async function updateCartItemAction(input: z.input<typeof updateSchema>): Promise<CartActionResult> {
  const { itemId, quantity } = updateSchema.parse(input);
  const item = await ownItem(itemId);
  if (!item) return { ok: false, error: "unavailable" };

  if (quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    const variant = await sellableVariant(item.variantId);
    const finalQty = Math.min(quantity, Math.max(variant?.stock ?? 0, 1));
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: finalQty } });
    if (finalQty < quantity) {
      revalidateCart();
      return { ok: true, error: "limited", available: finalQty };
    }
  }
  revalidateCart();
  return { ok: true };
}

export async function removeCartItemAction(formData: FormData) {
  const itemId = z.string().min(1).max(40).parse(formData.get("itemId"));
  const item = await ownItem(itemId);
  if (item) await db.cartItem.delete({ where: { id: item.id } });
  revalidateCart();
}
