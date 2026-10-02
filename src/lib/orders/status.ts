import type { AdminRole, OrderStatus } from "@/generated/prisma/enums";
import { hasPermission } from "@/lib/auth/roles";

/** Order lifecycle. CANCELLED and RETURNED are final. */
export const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export const ORDER_STATUSES = Object.keys(NEXT_STATUSES) as OrderStatus[];

/** Cancelling and accepting returns move money and stock, so they need refund rights. */
const NEEDS_REFUND_PERMISSION: readonly OrderStatus[] = ["CANCELLED", "RETURNED"];

export function canTransition(from: OrderStatus, to: OrderStatus, role: AdminRole): boolean {
  if (!NEXT_STATUSES[from].includes(to)) return false;
  if (!hasPermission(role, "orders:update-status")) return false;
  if (NEEDS_REFUND_PERMISSION.includes(to)) return hasPermission(role, "orders:refund");
  return true;
}

export function allowedNextStatuses(from: OrderStatus, role: AdminRole): OrderStatus[] {
  return NEXT_STATUSES[from].filter((to) => canTransition(from, to, role));
}

/** Stock reserved for the order goes back on the shelf when it is cancelled. */
export function releasesStock(to: OrderStatus): boolean {
  return to === "CANCELLED";
}

/** The GST invoice number is issued when the parcel is packed (it goes inside the parcel). */
export function issuesInvoice(to: OrderStatus): boolean {
  return to === "PACKED";
}
