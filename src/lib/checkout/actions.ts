"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/cart/server";
import { db } from "@/lib/db";
import { quoteDelivery, type DeliveryQuote } from "@/lib/delivery";
import { PlaceOrderFailure, placeOrder } from "@/lib/orders/place";
import { formatINR } from "@/lib/format";
import { notify, OWNER_MOBILE } from "@/lib/notifications";
import { getSetting } from "@/lib/settings";
import { checkoutSchema, LAST_ORDER_COOKIE } from "./schema";

/** Live PIN code check used by the checkout form (shipping, COD, delivery area). */
export async function checkPincodeAction(pincode: string): Promise<DeliveryQuote> {
  const code = String(pincode).trim().slice(0, 6);
  const [{ totals }, shipping, cod, row] = await Promise.all([
    getCart(),
    getSetting("shipping"),
    getSetting("cod"),
    /^\d{6}$/.test(code) ? db.serviceablePincode.findUnique({ where: { pincode: code } }) : null,
  ]);
  return quoteDelivery(code, row, { shipping, cod }, totals.subtotal);
}

export type CheckoutState = { errors?: Record<string, string>; detail?: string };

export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      errors[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
    }
    return { errors };
  }

  const { cartId } = await getCart();
  if (!cartId) return { errors: { _form: "emptyCart" } };

  let orderNumber: string;
  try {
    const placed = await placeOrder(cartId, parsed.data);
    orderNumber = placed.orderNumber;
    const vars = {
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      city: parsed.data.city,
      orderNumber,
      total: formatINR(placed.grandTotal / 100),
    };
    await notify({
      event: "ORDER_PLACED",
      to: parsed.data.mobile,
      audience: "CUSTOMER",
      orderId: placed.orderId,
      vars,
    });
    await notify({
      event: "OWNER_NEW_ORDER",
      to: OWNER_MOBILE,
      audience: "OWNER",
      orderId: placed.orderId,
      vars,
    });
  } catch (error) {
    if (error instanceof PlaceOrderFailure) {
      const field = error.code === "invalidPincode" || error.code === "notServiceable" ? "pincode" : "_form";
      return { errors: { [field]: error.code }, detail: error.detail };
    }
    console.error("placeOrder failed", error);
    return { errors: { _form: "failed" } };
  }

  // The success page shows only the order this browser just placed.
  const store = await cookies();
  store.set(LAST_ORDER_COOKIE, orderNumber, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect("/order/success");
}
