import "server-only";
import { db } from "@/lib/db";
import type { DateRange, ReportOrder, StockBatch } from "./compute";

/** Orders placed in the range, plus orders invoiced in the range (for the GST summary). */
export async function loadReportOrders(
  range: DateRange,
): Promise<{ placed: ReportOrder[]; invoiced: ReportOrder[] }> {
  const select = {
    orderNumber: true,
    placedAt: true,
    status: true,
    paymentMethod: true,
    paymentStatus: true,
    grandTotal: true,
    shippingCharge: true,
    invoiceNumber: true,
    invoiceDate: true,
    items: {
      select: {
        productNameHi: true,
        variantLabel: true,
        sku: true,
        hsnCode: true,
        gstRate: true,
        quantity: true,
        lineTotal: true,
        taxableValue: true,
        cgst: true,
        sgst: true,
        igst: true,
        variant: {
          select: { productId: true, product: { select: { category: { select: { nameHi: true } } } } },
        },
      },
    },
  } as const;

  const [placed, invoiced] = await Promise.all([
    db.order.findMany({
      where: { placedAt: { gte: range.start, lt: range.end } },
      orderBy: { placedAt: "asc" },
      select,
    }),
    db.order.findMany({
      where: { invoiceDate: { gte: range.start, lt: range.end } },
      orderBy: { invoiceDate: "asc" },
      select,
    }),
  ]);

  const map = (o: (typeof placed)[number]): ReportOrder => ({
    orderNumber: o.orderNumber,
    placedAt: o.placedAt,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    grandTotal: o.grandTotal.toString(),
    shippingCharge: o.shippingCharge.toString(),
    invoiceNumber: o.invoiceNumber,
    invoiceDate: o.invoiceDate,
    items: o.items.map((i) => ({
      productId: i.variant.productId,
      productName: i.productNameHi,
      categoryName: i.variant.product.category.nameHi,
      variantLabel: i.variantLabel,
      sku: i.sku,
      hsnCode: i.hsnCode,
      gstRate: i.gstRate.toString(),
      quantity: i.quantity,
      lineTotal: i.lineTotal.toString(),
      taxableValue: i.taxableValue.toString(),
      cgst: i.cgst.toString(),
      sgst: i.sgst.toString(),
      igst: i.igst.toString(),
    })),
  });
  return { placed: placed.map(map), invoiced: invoiced.map(map) };
}

export async function loadStockBatches(): Promise<StockBatch[]> {
  const batches = await db.inventoryBatch.findMany({
    where: { qtyAvailable: { gt: 0 }, variant: { product: { deletedAt: null } } },
    select: {
      qtyAvailable: true,
      costPrice: true,
      variant: { select: { sku: true, label: true, price: true, product: { select: { nameHi: true } } } },
    },
  });
  return batches.map((b) => ({
    sku: b.variant.sku,
    product: b.variant.product.nameHi,
    pack: b.variant.label,
    qtyAvailable: b.qtyAvailable,
    costPrice: b.costPrice?.toString() ?? null,
    sellingPrice: b.variant.price.toString(),
  }));
}
