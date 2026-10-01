import { describe, expect, it } from "vitest";
import { adjustmentDelta, allocateFefo, expiryStatus, NEAR_EXPIRY_DAYS, stockLevel } from "./rules";
import { adjustStockSchema, receiveStockSchema } from "./schemas";

const now = new Date("2026-10-01T06:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

describe("expiryStatus", () => {
  it("classifies expiry dates", () => {
    expect(expiryStatus(null, now)).toBe("NONE");
    expect(expiryStatus(days(-1), now)).toBe("EXPIRED");
    expect(expiryStatus(now, now)).toBe("EXPIRED");
    expect(expiryStatus(days(10), now)).toBe("NEAR");
    expect(expiryStatus(days(NEAR_EXPIRY_DAYS), now)).toBe("NEAR");
    expect(expiryStatus(days(NEAR_EXPIRY_DAYS + 1), now)).toBe("OK");
  });
});

describe("stockLevel", () => {
  it("compares sellable stock with the threshold", () => {
    expect(stockLevel(0, 5)).toBe("OUT");
    expect(stockLevel(5, 5)).toBe("LOW");
    expect(stockLevel(6, 5)).toBe("OK");
    expect(stockLevel(1, 0)).toBe("OK");
  });
});

describe("allocateFefo", () => {
  const batches = [
    { id: "late", qtyAvailable: 10, expiryDate: days(300), receivedAt: days(-30) },
    { id: "soon", qtyAvailable: 3, expiryDate: days(20), receivedAt: days(-10) },
    { id: "expired", qtyAvailable: 50, expiryDate: days(-1), receivedAt: days(-200) },
    { id: "no-expiry-old", qtyAvailable: 4, expiryDate: null, receivedAt: days(-90) },
    { id: "no-expiry-new", qtyAvailable: 4, expiryDate: null, receivedAt: days(-5) },
    { id: "empty", qtyAvailable: 0, expiryDate: days(5), receivedAt: days(-5) },
  ];

  it("takes the earliest-expiring stock first", () => {
    expect(allocateFefo(batches, 2, now)).toEqual([{ batchId: "soon", quantity: 2 }]);
  });

  it("spills over into the next batches", () => {
    expect(allocateFefo(batches, 15, now)).toEqual([
      { batchId: "soon", quantity: 3 },
      { batchId: "late", quantity: 10 },
      { batchId: "no-expiry-old", quantity: 2 },
    ]);
  });

  it("never uses expired or empty batches", () => {
    // Sellable = 3 + 10 + 4 + 4 = 21
    expect(allocateFefo(batches, 21, now)?.map((a) => a.batchId)).toEqual([
      "soon",
      "late",
      "no-expiry-old",
      "no-expiry-new",
    ]);
    expect(allocateFefo(batches, 22, now)).toBeNull();
  });

  it("rejects non-positive or fractional quantities", () => {
    expect(allocateFefo(batches, 0, now)).toBeNull();
    expect(allocateFefo(batches, 1.5, now)).toBeNull();
  });
});

describe("adjustmentDelta", () => {
  it("applies the sign rules per type", () => {
    expect(adjustmentDelta("DAMAGE", 3)).toBe(-3);
    expect(adjustmentDelta("DAMAGE", -3)).toBe(-3);
    expect(adjustmentDelta("RETURN", 2)).toBe(2);
    expect(adjustmentDelta("ADJUSTMENT", -4)).toBe(-4);
    expect(adjustmentDelta("ADJUSTMENT", 4)).toBe(4);
  });
});

function errorsOf(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));
}

describe("receiveStockSchema", () => {
  const base = { variantId: "v1", batchNo: "rs-2026/07", quantity: "40" };

  it("accepts a purchase and normalises the batch number", () => {
    const parsed = receiveStockSchema.parse({ ...base, expiryDate: "2027-06-30", costPrice: "980.50" });
    expect(parsed.batchNo).toBe("RS-2026/07");
    expect(parsed.quantity).toBe(40);
    expect(parsed.expiryDate?.toISOString()).toBe("2027-06-30T00:00:00.000Z");
    expect(parsed.mfgDate).toBeNull();
    expect(parsed.supplier).toBeNull();
  });

  it("rejects bad quantities, dates and batch numbers", () => {
    expect(errorsOf(receiveStockSchema.safeParse({ ...base, quantity: "0" }))).toEqual({
      quantity: "invalidQuantity",
    });
    expect(errorsOf(receiveStockSchema.safeParse({ ...base, quantity: "2.5" }))).toEqual({
      quantity: "invalidQuantity",
    });
    expect(errorsOf(receiveStockSchema.safeParse({ ...base, batchNo: "बैच 1" }))).toEqual({
      batchNo: "invalidBatchNo",
    });
    expect(errorsOf(receiveStockSchema.safeParse({ ...base, expiryDate: "2027-02-30" }))).toEqual({
      expiryDate: "invalidDate",
    });
  });

  it("rejects already-expired stock and expiry before manufacture", () => {
    expect(errorsOf(receiveStockSchema.safeParse({ ...base, expiryDate: "2020-01-01" }))).toEqual({
      expiryDate: "expiryPast",
    });
    expect(
      errorsOf(receiveStockSchema.safeParse({ ...base, mfgDate: "2026-05-01", expiryDate: "2026-04-01" }))
        .expiryDate,
    ).toBe("expiryBeforeMfg");
  });
});

describe("adjustStockSchema", () => {
  const base = { batchId: "b1", reason: "बोरी फटी हुई मिली" };

  it("allows negative numbers only for count corrections", () => {
    expect(adjustStockSchema.safeParse({ ...base, type: "ADJUSTMENT", quantity: "-2" }).success).toBe(true);
    expect(errorsOf(adjustStockSchema.safeParse({ ...base, type: "DAMAGE", quantity: "-2" }))).toEqual({
      quantity: "positiveOnly",
    });
  });

  it("requires a reason and a non-zero quantity", () => {
    expect(
      errorsOf(adjustStockSchema.safeParse({ batchId: "b1", type: "DAMAGE", quantity: "0", reason: "x" })),
    ).toEqual({
      quantity: "invalidQuantity",
      reason: "reasonRequired",
    });
  });
});
