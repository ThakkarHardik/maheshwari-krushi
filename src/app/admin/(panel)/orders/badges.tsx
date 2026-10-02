import type { OrderPaymentStatus, OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STATUS: Record<OrderStatus, string> = {
  PENDING: "bg-accent-300 text-brand-900",
  CONFIRMED: "bg-brand-100 text-brand-800",
  PACKED: "bg-brand-100 text-brand-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-brand-700 text-white",
  CANCELLED: "bg-muted text-muted-foreground line-through",
  RETURNED: "bg-red-100 text-danger",
};

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap", STATUS[status])}>
      {label}
    </span>
  );
}

export function PaymentBadge({ status, label }: { status: OrderPaymentStatus; label: string }) {
  const tone =
    status === "PAID" || status === "COD_COLLECTED"
      ? "text-brand-700"
      : status === "FAILED" || status === "REFUNDED"
        ? "text-danger"
        : "text-muted-foreground";
  return <span className={cn("text-xs font-medium whitespace-nowrap", tone)}>{label}</span>;
}
