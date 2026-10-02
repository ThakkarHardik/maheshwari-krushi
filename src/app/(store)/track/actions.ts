"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { normalizeIndianMobile } from "@/lib/enquiry/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  grandTotal: string;
  courierName: string | null;
  trackingNumber: string | null;
  items: { name: string; label: string; quantity: number }[];
  /** When each step was reached (ISO), for the progress bar. */
  reached: Partial<Record<OrderStatus, string>>;
};

export type TrackState = { error?: "invalid" | "notFound" | "tooMany"; order?: TrackedOrder };

const schema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/^#/, ""))
    .pipe(z.string().regex(/^[A-Z]{2,6}\d{4,10}$/)),
  mobile: z
    .string()
    .transform((v) => normalizeIndianMobile(v))
    .refine((v): v is string => v !== null),
});

export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`track:${ip}`, 10, 10 * 60_000)) return { error: "tooMany" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };

  // Both must match, so knowing an order number alone reveals nothing.
  const order = await db.order.findFirst({
    where: { orderNumber: parsed.data.orderNumber, shipMobile: parsed.data.mobile },
    select: {
      orderNumber: true,
      status: true,
      placedAt: true,
      grandTotal: true,
      courierName: true,
      trackingNumber: true,
      items: { select: { productNameHi: true, variantLabel: true, quantity: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
    },
  });
  if (!order) return { error: "notFound" };

  const reached: Partial<Record<OrderStatus, string>> = {};
  for (const h of order.statusHistory) reached[h.toStatus] ??= h.createdAt.toISOString();

  return {
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt.toISOString(),
      grandTotal: order.grandTotal.toString(),
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      items: order.items.map((i) => ({ name: i.productNameHi, label: i.variantLabel, quantity: i.quantity })),
      reached,
    },
  };
}
