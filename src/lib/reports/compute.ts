/** Pure report calculations (amounts in paise). */
import { toPaise } from "@/lib/pricing";

const IST_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ReportItem = {
  productId: string;
  productName: string;
  categoryName: string;
  variantLabel: string;
  sku: string;
  hsnCode: string;
  gstRate: string;
  quantity: number;
  lineTotal: string;
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
};

export type ReportOrder = {
  orderNumber: string;
  placedAt: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: string;
  shippingCharge: string;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  items: ReportItem[];
};

/** "2026-10-02" — the calendar day in India. */
export function istDateKey(date: Date): string {
  return new Date(date.getTime() + IST_MS).toISOString().slice(0, 10);
}

/** Start of a YYYY-MM-DD day in India, as a UTC instant. */
export function istDayStart(key: string): Date {
  return new Date(new Date(`${key}T00:00:00.000Z`).getTime() - IST_MS);
}

export type DateRange = { from: string; to: string; start: Date; end: Date };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const validKey = (v: string | undefined) =>
  v && DATE_KEY.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) ? v : null;

/** Inclusive IST date range from query params; defaults to this month so far, max 366 days. */
export function parseRange(fromParam?: string, toParam?: string, now = new Date()): DateRange {
  const today = istDateKey(now);
  let to = validKey(toParam) ?? today;
  let from = validKey(fromParam) ?? `${today.slice(0, 8)}01`;
  if (from > to) [from, to] = [to, from];
  const start = istDayStart(from);
  let end = new Date(istDayStart(to).getTime() + DAY_MS);
  if (end.getTime() - start.getTime() > 366 * DAY_MS) {
    end = new Date(start.getTime() + 366 * DAY_MS);
    to = istDateKey(new Date(end.getTime() - 1));
  }
  return { from, to, start, end };
}

/** Orders that count as sales (not cancelled or returned). */
export const isSale = (o: ReportOrder) => o.status !== "CANCELLED" && o.status !== "RETURNED";

export function summarizeSales(orders: ReportOrder[]) {
  const sales = orders.filter(isSale);
  const revenue = sales.reduce((s, o) => s + toPaise(o.grandTotal), 0);
  const shipping = sales.reduce((s, o) => s + toPaise(o.shippingCharge), 0);
  const itemsSold = sales.reduce((s, o) => s + o.items.reduce((q, i) => q + i.quantity, 0), 0);
  const cod = (status: string) =>
    sales.filter((o) => o.paymentStatus === status).reduce((s, o) => s + toPaise(o.grandTotal), 0);
  return {
    orderCount: sales.length,
    cancelledCount: orders.length - sales.length,
    itemsSold,
    revenue,
    shipping,
    averageOrder: sales.length ? Math.round(revenue / sales.length) : 0,
    codCollected: cod("COD_COLLECTED"),
    codPending: cod("COD_PENDING"),
  };
}

export function salesByDay(orders: ReportOrder[]) {
  const days = new Map<string, { day: string; orders: number; revenue: number }>();
  for (const o of orders.filter(isSale)) {
    const day = istDateKey(o.placedAt);
    const row = days.get(day) ?? { day, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += toPaise(o.grandTotal);
    days.set(day, row);
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export function salesByProduct(orders: ReportOrder[]) {
  const rows = new Map<
    string,
    { sku: string; product: string; pack: string; category: string; quantity: number; revenue: number }
  >();
  for (const o of orders.filter(isSale)) {
    for (const i of o.items) {
      const row = rows.get(i.sku) ?? {
        sku: i.sku,
        product: i.productName,
        pack: i.variantLabel,
        category: i.categoryName,
        quantity: 0,
        revenue: 0,
      };
      row.quantity += i.quantity;
      row.revenue += toPaise(i.lineTotal);
      rows.set(i.sku, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue || a.product.localeCompare(b.product));
}

export function salesByCategory(orders: ReportOrder[]) {
  const rows = new Map<string, { category: string; quantity: number; revenue: number }>();
  for (const p of salesByProduct(orders)) {
    const row = rows.get(p.category) ?? { category: p.category, quantity: 0, revenue: 0 };
    row.quantity += p.quantity;
    row.revenue += p.revenue;
    rows.set(p.category, row);
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}

/**
 * GST summary by HSN code and rate, for invoices issued in the period (excluding
 * cancelled orders). Delivery charges are listed separately (no GST applied yet).
 * Returned orders still appear here: issue a credit note for them when filing.
 */
export function gstSummary(orders: ReportOrder[]) {
  const invoiced = orders.filter((o) => o.invoiceNumber && o.status !== "CANCELLED");
  const rows = new Map<
    string,
    {
      hsn: string;
      rate: number;
      quantity: number;
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    }
  >();
  for (const o of invoiced) {
    for (const i of o.items) {
      const rate = Number(i.gstRate);
      const key = `${i.hsnCode}|${rate}`;
      const row = rows.get(key) ?? {
        hsn: i.hsnCode,
        rate,
        quantity: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      };
      row.quantity += i.quantity;
      row.taxable += toPaise(i.taxableValue);
      row.cgst += toPaise(i.cgst);
      row.sgst += toPaise(i.sgst);
      row.igst += toPaise(i.igst);
      row.total += toPaise(i.lineTotal);
      rows.set(key, row);
    }
  }
  const lines = [...rows.values()].sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rate - b.rate);
  const sum = (k: "taxable" | "cgst" | "sgst" | "igst" | "total") => lines.reduce((s, l) => s + l[k], 0);
  return {
    invoiceCount: invoiced.length,
    returnedCount: invoiced.filter((o) => o.status === "RETURNED").length,
    lines,
    totals: {
      taxable: sum("taxable"),
      cgst: sum("cgst"),
      sgst: sum("sgst"),
      igst: sum("igst"),
      total: sum("total"),
    },
    shipping: invoiced.reduce((s, o) => s + toPaise(o.shippingCharge), 0),
  };
}

export type StockBatch = {
  sku: string;
  product: string;
  pack: string;
  qtyAvailable: number;
  costPrice: string | null;
  sellingPrice: string;
};

/** Stock value at cost (where cost is known) and at selling price. */
export function stockValuation(batches: StockBatch[]) {
  const rows = new Map<
    string,
    {
      sku: string;
      product: string;
      pack: string;
      quantity: number;
      atCost: number;
      atPrice: number;
      missingCost: number;
    }
  >();
  for (const b of batches) {
    if (b.qtyAvailable <= 0) continue;
    const row = rows.get(b.sku) ?? {
      sku: b.sku,
      product: b.product,
      pack: b.pack,
      quantity: 0,
      atCost: 0,
      atPrice: 0,
      missingCost: 0,
    };
    row.quantity += b.qtyAvailable;
    row.atPrice += toPaise(b.sellingPrice) * b.qtyAvailable;
    if (b.costPrice === null) row.missingCost += b.qtyAvailable;
    else row.atCost += toPaise(b.costPrice) * b.qtyAvailable;
    rows.set(b.sku, row);
  }
  const lines = [...rows.values()].sort((a, b) => a.product.localeCompare(b.product));
  return {
    lines,
    totals: {
      quantity: lines.reduce((s, l) => s + l.quantity, 0),
      atCost: lines.reduce((s, l) => s + l.atCost, 0),
      atPrice: lines.reduce((s, l) => s + l.atPrice, 0),
      missingCost: lines.reduce((s, l) => s + l.missingCost, 0),
    },
  };
}
