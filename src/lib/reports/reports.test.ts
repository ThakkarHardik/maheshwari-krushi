import { describe, expect, it } from "vitest";
import { averageRating } from "../reviews/schema";
import {
  gstSummary,
  istDateKey,
  parseRange,
  salesByCategory,
  salesByDay,
  salesByProduct,
  stockValuation,
  summarizeSales,
  type ReportItem,
  type ReportOrder,
} from "./compute";
import { csvAmount, toCsv } from "./csv";

const item = (over: Partial<ReportItem>): ReportItem => ({
  productId: "p1",
  productName: "तार्वर्त पावर",
  categoryName: "प्लांट टॉनिक",
  variantLabel: "1 लीटर",
  sku: "TP-1L",
  hsnCode: "3101",
  gstRate: "5",
  quantity: 1,
  lineTotal: "650",
  taxableValue: "619.05",
  cgst: "15.48",
  sgst: "15.47",
  igst: "0",
  ...over,
});

const order = (over: Partial<ReportOrder>): ReportOrder => ({
  orderNumber: "MKSC1",
  placedAt: new Date("2026-10-01T06:00:00Z"),
  status: "DELIVERED",
  paymentMethod: "COD",
  paymentStatus: "COD_COLLECTED",
  grandTotal: "710",
  shippingCharge: "60",
  invoiceNumber: "MKSC/2026-27/0001",
  invoiceDate: new Date("2026-10-01T08:00:00Z"),
  items: [item({})],
  ...over,
});

const orders: ReportOrder[] = [
  order({}),
  order({
    orderNumber: "MKSC2",
    placedAt: new Date("2026-10-01T20:00:00Z"), // 2 Oct 01:30 in India
    paymentStatus: "COD_PENDING",
    status: "SHIPPED",
    grandTotal: "960",
    invoiceNumber: "MKSC/2026-27/0002",
    items: [
      item({
        quantity: 2,
        lineTotal: "900",
        sku: "BH-250",
        productName: "भिंडी बीज",
        categoryName: "बीज",
        hsnCode: "1209",
        gstRate: "0",
        taxableValue: "900",
        cgst: "0",
        sgst: "0",
      }),
    ],
  }),
  order({ orderNumber: "MKSC3", status: "CANCELLED", grandTotal: "500", invoiceNumber: null }),
];

describe("IST dates and ranges", () => {
  it("uses the Indian calendar day", () => {
    expect(istDateKey(new Date("2026-10-01T20:00:00Z"))).toBe("2026-10-02");
    expect(istDateKey(new Date("2026-10-01T18:00:00Z"))).toBe("2026-10-01");
  });

  it("defaults to this month and covers whole IST days", () => {
    const r = parseRange(undefined, undefined, new Date("2026-10-15T10:00:00Z"));
    expect([r.from, r.to]).toEqual(["2026-10-01", "2026-10-15"]);
    expect(r.start.toISOString()).toBe("2026-09-30T18:30:00.000Z");
    expect(r.end.toISOString()).toBe("2026-10-15T18:30:00.000Z");
  });

  it("swaps reversed dates, ignores junk and caps at 366 days", () => {
    expect(parseRange("2026-10-10", "2026-10-01").from).toBe("2026-10-01");
    expect(parseRange("nonsense", "2026-10-05", new Date("2026-10-20T00:00:00Z")).from).toBe("2026-10-01");
    expect(parseRange("2020-01-01", "2026-10-01").to).toBe("2020-12-31"); // 366 days (leap year)
  });
});

describe("sales reports", () => {
  it("summarises sales, leaving out cancelled orders", () => {
    expect(summarizeSales(orders)).toEqual({
      orderCount: 2,
      cancelledCount: 1,
      itemsSold: 3,
      revenue: 167000,
      shipping: 12000,
      averageOrder: 83500,
      codCollected: 71000,
      codPending: 96000,
    });
  });

  it("groups by IST day, product and category", () => {
    expect(salesByDay(orders)).toEqual([
      { day: "2026-10-01", orders: 1, revenue: 71000 },
      { day: "2026-10-02", orders: 1, revenue: 96000 },
    ]);
    expect(salesByProduct(orders).map((p) => [p.sku, p.quantity, p.revenue])).toEqual([
      ["BH-250", 2, 90000],
      ["TP-1L", 1, 65000],
    ]);
    expect(salesByCategory(orders).map((c) => c.category)).toEqual(["बीज", "प्लांट टॉनिक"]);
  });
});

describe("gstSummary", () => {
  it("totals invoiced, non-cancelled orders by HSN and rate", () => {
    const gst = gstSummary(orders);
    expect(gst.invoiceCount).toBe(2);
    expect(gst.lines.map((l) => [l.hsn, l.rate, l.taxable, l.cgst, l.sgst])).toEqual([
      ["1209", 0, 90000, 0, 0],
      ["3101", 5, 61905, 1548, 1547],
    ]);
    expect(gst.totals.total).toBe(155000);
    expect(gst.shipping).toBe(12000);
  });

  it("flags returned orders for credit notes", () => {
    expect(gstSummary([order({ status: "RETURNED" })]).returnedCount).toBe(1);
  });
});

describe("stockValuation", () => {
  it("values stock at cost and selling price, counting units without a cost", () => {
    const v = stockValuation([
      { sku: "A", product: "A", pack: "1", qtyAvailable: 10, costPrice: "290", sellingPrice: "360" },
      { sku: "A", product: "A", pack: "1", qtyAvailable: 5, costPrice: null, sellingPrice: "360" },
      { sku: "B", product: "B", pack: "1", qtyAvailable: 0, costPrice: "10", sellingPrice: "20" },
    ]);
    expect(v.lines).toHaveLength(1);
    expect(v.totals).toEqual({ quantity: 15, atCost: 290000, atPrice: 540000, missingCost: 5 });
  });
});

describe("toCsv", () => {
  it("adds a BOM, quotes special characters and keeps Hindi", () => {
    const csv = toCsv(
      ["Product", "Qty"],
      [
        ["भिंडी, बीज", 2],
        ['He said "hi"', null],
      ],
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"भिंडी, बीज",2');
    expect(csv).toContain('"He said ""hi""",');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(toCsv(["x"], [['=HYPERLINK("http://evil")'], ["@SUM(A1)"]])).toContain("'@SUM(A1)");
    expect(toCsv(["x"], [["=1+1"]])).toContain("'=1+1");
  });

  it("formats amounts plainly", () => {
    expect(csvAmount(123450)).toBe("1234.50");
  });
});

describe("averageRating", () => {
  it("averages to two decimals", () => {
    expect(averageRating([])).toEqual({ avg: 0, count: 0 });
    expect(averageRating([5, 4, 4])).toEqual({ avg: 4.33, count: 3 });
  });
});
