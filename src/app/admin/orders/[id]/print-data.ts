import "server-only";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function loadPrintableOrder(id: string) {
  await requireAdmin("orders:view");
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: { allocations: { include: { batch: { select: { batchNo: true, expiryDate: true } } } } },
      },
    },
  });
  if (!order) notFound();
  return order;
}
