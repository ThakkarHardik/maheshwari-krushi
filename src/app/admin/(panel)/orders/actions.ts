"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { markCodCollected, OrderActionError, transitionOrder } from "@/lib/orders/admin-service";
import { ORDER_STATUSES } from "@/lib/orders/status";

export type OrderActionState = { ok?: boolean; error?: string };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const transitionSchema = z.object({
  orderId: z.string().min(1),
  to: z.enum(ORDER_STATUSES as [string, ...string[]]),
  note: optionalText(300),
  courierName: optionalText(80),
  trackingNumber: optionalText(60),
  codCollected: z.literal("on").optional(),
  restock: z.literal("on").optional(),
});

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
}

export async function transitionOrderAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const admin = await requireAdmin("orders:update-status");
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { orderId, to, ...rest } = parsed.data;
  try {
    await transitionOrder(
      orderId,
      to as (typeof ORDER_STATUSES)[number],
      { ...rest, codCollected: rest.codCollected === "on", restock: rest.restock === "on" },
      admin,
    );
  } catch (error) {
    if (error instanceof OrderActionError) return { error: error.code };
    throw error;
  }
  revalidateOrder(orderId);
  return { ok: true };
}

export async function markCodCollectedAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const admin = await requireAdmin("orders:update-status");
  const orderId = z.string().min(1).parse(formData.get("orderId"));
  try {
    await markCodCollected(orderId, admin.id);
  } catch (error) {
    if (error instanceof OrderActionError) return { error: error.code };
    throw error;
  }
  revalidateOrder(orderId);
  return { ok: true };
}

export async function saveOrderNoteAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requireAdmin("orders:view");
  const { orderId, adminNote } = z
    .object({ orderId: z.string().min(1), adminNote: optionalText(2000) })
    .parse(Object.fromEntries(formData));
  await db.order.update({ where: { id: orderId }, data: { adminNote } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Called after staff opens WhatsApp with a queued message. */
export async function markNotificationSentAction(notificationId: string) {
  await requireAdmin("orders:view");
  const id = z.string().min(1).max(40).parse(notificationId);
  const row = await db.notification.update({
    where: { id, status: { in: ["QUEUED", "FAILED"] } },
    data: { status: "MANUAL_SENT", sentAt: new Date() },
    select: { orderId: true },
  });
  if (row.orderId) revalidatePath(`/admin/orders/${row.orderId}`);
}
