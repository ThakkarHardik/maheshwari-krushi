import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout/schema";
import { quoteDelivery, type DeliverySettings, type ServiceableRow } from "./delivery";
import {
  paiseToDecimalString,
  priceLine,
  priceOrder,
  shippingFor,
  stateFromPincode,
  toPaise,
} from "./pricing";

describe("paise helpers", () => {
  it("converts both ways without float drift", () => {
    expect(toPaise("650")).toBe(65000);
    expect(toPaise("0.1")).toBe(10);
    expect(toPaise({ toString: () => "1250.50" })).toBe(125050);
    expect(paiseToDecimalString(65000)).toBe("650.00");
    expect(paiseToDecimalString(5)).toBe("0.05");
    expect(paiseToDecimalString(-150)).toBe("-1.50");
  });
});

describe("priceLine (GST-inclusive prices)", () => {
  it("back-calculates 5% GST and splits CGST/SGST inside the state", () => {
    // 2 × ₹650 = ₹1300 incl. 5% → taxable 1238.10, tax 61.90
    expect(priceLine({ unitPrice: "650", quantity: 2, gstRate: "5" }, true)).toEqual({
      lineTotal: 130000,
      taxable: 123810,
      cgst: 3095,
      sgst: 3095,
      igst: 0,
    });
  });

  it("uses IGST for other states", () => {
    expect(priceLine({ unitPrice: "650", quantity: 2, gstRate: 5 }, false)).toMatchObject({
      cgst: 0,
      sgst: 0,
      igst: 6190,
    });
  });

  it("handles 0% GST (seeds) and keeps tax parts summing exactly", () => {
    expect(priceLine({ unitPrice: "450", quantity: 3, gstRate: "0.00" }, true)).toEqual({
      lineTotal: 135000,
      taxable: 135000,
      cgst: 0,
      sgst: 0,
      igst: 0,
    });
    const odd = priceLine({ unitPrice: "99.99", quantity: 1, gstRate: "18" }, true);
    expect(odd.taxable + odd.cgst + odd.sgst).toBe(odd.lineTotal);
  });
});

describe("priceOrder", () => {
  it("adds shipping after tax and totals everything", () => {
    const totals = priceOrder(
      [
        { unitPrice: "650", quantity: 1, gstRate: "5" },
        { unitPrice: "450", quantity: 2, gstRate: "0" },
      ],
      { shippingPaise: 6000, intraState: true },
    );
    expect(totals.itemCount).toBe(3);
    expect(totals.subtotal).toBe(155000);
    expect(totals.shipping).toBe(6000);
    expect(totals.grandTotal).toBe(161000);
    expect(totals.taxable + totals.cgst + totals.sgst).toBe(totals.subtotal);
  });
});

describe("shippingFor", () => {
  it("prefers free shipping, then the PIN code charge, then the flat charge", () => {
    expect(shippingFor(50000, { flatCharge: 60, freeShippingAbove: null })).toBe(6000);
    expect(shippingFor(50000, { flatCharge: 60, freeShippingAbove: null, pincodeCharge: "40" })).toBe(4000);
    expect(shippingFor(50000, { flatCharge: 60, freeShippingAbove: 500, pincodeCharge: "40" })).toBe(0);
    expect(shippingFor(49999, { flatCharge: 60, freeShippingAbove: 500 })).toBe(6000);
  });
});

describe("stateFromPincode", () => {
  it("recognises Madhya Pradesh PIN codes", () => {
    expect(stateFromPincode("457550")).toBe("Madhya Pradesh");
    expect(stateFromPincode("452001")).toBe("Madhya Pradesh");
    expect(stateFromPincode("400001")).toBeNull(); // Mumbai
    expect(stateFromPincode("492001")).toBeNull(); // Raipur (Chhattisgarh)
  });
});

describe("quoteDelivery", () => {
  const settings: DeliverySettings = {
    shipping: { flatCharge: 60, freeShippingAbove: null, deliverEverywhere: false },
    cod: { enabled: true, maxOrderValue: 5000 },
  };
  const sailana: ServiceableRow = {
    pincode: "457550",
    city: "Sailana",
    state: "Madhya Pradesh",
    deliveryCharge: null,
    codAllowed: true,
    etaDays: 1,
    isActive: true,
  };

  it("quotes a listed PIN code", () => {
    expect(quoteDelivery("457550", sailana, settings, 130000)).toEqual({
      ok: true,
      pincode: "457550",
      city: "Sailana",
      state: "Madhya Pradesh",
      shippingPaise: 6000,
      codAvailable: true,
      codReason: null,
      etaDays: 1,
    });
  });

  it("refuses unlisted or inactive PIN codes unless delivering everywhere", () => {
    expect(quoteDelivery("400001", null, settings, 1000)).toEqual({ ok: false, reason: "notServiceable" });
    expect(quoteDelivery("457550", { ...sailana, isActive: false }, settings, 1000)).toEqual({
      ok: false,
      reason: "notServiceable",
    });
    const everywhere = { ...settings, shipping: { ...settings.shipping, deliverEverywhere: true } };
    expect(quoteDelivery("400001", null, everywhere, 1000)).toMatchObject({ ok: true, state: "Other" });
  });

  it("validates the PIN code format", () => {
    expect(quoteDelivery("12345", null, settings, 0)).toEqual({ ok: false, reason: "invalidPincode" });
    expect(quoteDelivery("057550", null, settings, 0)).toEqual({ ok: false, reason: "invalidPincode" });
  });

  it("applies COD rules", () => {
    expect(quoteDelivery("457550", { ...sailana, codAllowed: false }, settings, 1000)).toMatchObject({
      codAvailable: false,
      codReason: "pincode",
    });
    // ₹4,950 + ₹60 shipping > ₹5,000 limit
    expect(quoteDelivery("457550", sailana, settings, 495000)).toMatchObject({
      codAvailable: false,
      codReason: "maxValue",
    });
    expect(
      quoteDelivery("457550", sailana, { ...settings, cod: { enabled: false, maxOrderValue: 5000 } }, 1000),
    ).toMatchObject({
      codReason: "disabled",
    });
  });
});

describe("checkoutSchema", () => {
  const valid = {
    name: "रमेश पटेल",
    mobile: "098765 43210",
    address: "वार्ड 5, महावीर मार्ग, बस स्टैंड के पास",
    city: "सैलाना",
    pincode: "457550",
    paymentMethod: "COD",
  };

  it("accepts a valid checkout", () => {
    expect(checkoutSchema.parse(valid)).toMatchObject({
      mobile: "9876543210",
      note: null,
      paymentMethod: "COD",
    });
  });

  it("returns a message key per invalid field", () => {
    const result = checkoutSchema.safeParse({
      name: "",
      mobile: "1",
      address: "x",
      city: "",
      pincode: "4575",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const byField = Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
      expect(byField).toEqual({
        name: "nameRequired",
        mobile: "invalidMobile",
        address: "addressRequired",
        city: "cityRequired",
        pincode: "invalidPincode",
        paymentMethod: "paymentRequired",
      });
    }
  });
});
