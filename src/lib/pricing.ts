/**
 * Order pricing and GST, in whole paise to avoid floating-point errors.
 * Selling prices INCLUDE GST, so tax is back-calculated from each line total.
 * Inside the seller's state → CGST + SGST (half each); other states → IGST.
 */

type Numeric = number | string | { toString(): string };

export function toPaise(value: Numeric): number {
  const n = Number(value.toString());
  if (!Number.isFinite(n)) throw new Error(`Invalid amount: ${value}`);
  return Math.round(n * 100);
}

/** Paise → "650.00" for storing in Decimal columns. */
export function paiseToDecimalString(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export type PricingLine = {
  /** Unit price including GST. */
  unitPrice: Numeric;
  quantity: number;
  /** GST percentage, e.g. 5 or "18.00". */
  gstRate: Numeric;
};

export type LineTotals = {
  lineTotal: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export function priceLine(line: PricingLine, intraState: boolean): LineTotals {
  const lineTotal = toPaise(line.unitPrice) * line.quantity;
  const rateBp = Math.round(Number(line.gstRate.toString()) * 100); // 5% → 500 basis points
  const taxable = Math.round((lineTotal * 10_000) / (10_000 + rateBp));
  const tax = lineTotal - taxable;
  if (!intraState) return { lineTotal, taxable, cgst: 0, sgst: 0, igst: tax };
  const cgst = Math.round(tax / 2);
  return { lineTotal, taxable, cgst, sgst: tax - cgst, igst: 0 };
}

export type OrderTotals = {
  lines: LineTotals[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
};

/**
 * Shipping is added after tax for now (not part of the GST calculation).
 * TODO(client/CA): confirm whether delivery charges should carry GST on the invoice.
 */
export function priceOrder(
  lines: PricingLine[],
  {
    shippingPaise,
    discountPaise = 0,
    intraState,
  }: { shippingPaise: number; discountPaise?: number; intraState: boolean },
): OrderTotals {
  const priced = lines.map((l) => priceLine(l, intraState));
  const sum = (key: keyof LineTotals) => priced.reduce((s, l) => s + l[key], 0);
  const subtotal = sum("lineTotal");
  return {
    lines: priced,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    shipping: shippingPaise,
    discount: discountPaise,
    taxable: sum("taxable"),
    cgst: sum("cgst"),
    sgst: sum("sgst"),
    igst: sum("igst"),
    grandTotal: subtotal + shippingPaise - discountPaise,
  };
}

/**
 * Shipping for an order: free above the threshold (if set), else the pincode's
 * own charge, else the flat charge.
 */
export function shippingFor(
  subtotalPaise: number,
  {
    flatCharge,
    freeShippingAbove,
    pincodeCharge,
  }: { flatCharge: number; freeShippingAbove: number | null; pincodeCharge?: Numeric | null },
): number {
  if (freeShippingAbove !== null && subtotalPaise >= toPaise(freeShippingAbove)) return 0;
  if (pincodeCharge !== null && pincodeCharge !== undefined) return toPaise(pincodeCharge);
  return toPaise(flatCharge);
}

/** Indian PIN codes 45xxxx–48xxxx are in Madhya Pradesh. */
export function stateFromPincode(pincode: string): string | null {
  return /^4[5-8]\d{4}$/.test(pincode) ? "Madhya Pradesh" : null;
}
