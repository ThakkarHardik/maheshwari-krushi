import { shippingFor, stateFromPincode, toPaise } from "./pricing";

export const PINCODE_PATTERN = /^[1-9]\d{5}$/;

export type ServiceableRow = {
  pincode: string;
  city: string;
  state: string;
  deliveryCharge: { toString(): string } | null;
  codAllowed: boolean;
  etaDays: number;
  isActive: boolean;
};

export type DeliverySettings = {
  shipping: { flatCharge: number; freeShippingAbove: number | null; deliverEverywhere: boolean };
  cod: { enabled: boolean; maxOrderValue: number };
};

export type DeliveryQuote =
  | { ok: false; reason: "invalidPincode" | "notServiceable" }
  | {
      ok: true;
      pincode: string;
      city: string | null;
      state: string;
      shippingPaise: number;
      codAvailable: boolean;
      /** Why COD is unavailable, when it is. */
      codReason: "disabled" | "pincode" | "maxValue" | null;
      etaDays: number | null;
    };

/** Pure delivery decision for a PIN code and cart subtotal. */
export function quoteDelivery(
  pincode: string,
  row: ServiceableRow | null,
  settings: DeliverySettings,
  subtotalPaise: number,
): DeliveryQuote {
  if (!PINCODE_PATTERN.test(pincode)) return { ok: false, reason: "invalidPincode" };
  const listed = row && row.isActive ? row : null;
  if (!listed && !settings.shipping.deliverEverywhere) return { ok: false, reason: "notServiceable" };

  const shippingPaise = shippingFor(subtotalPaise, {
    flatCharge: settings.shipping.flatCharge,
    freeShippingAbove: settings.shipping.freeShippingAbove,
    pincodeCharge: listed?.deliveryCharge ?? null,
  });

  let codReason: "disabled" | "pincode" | "maxValue" | null = null;
  if (!settings.cod.enabled) codReason = "disabled";
  else if (listed && !listed.codAllowed) codReason = "pincode";
  else if (subtotalPaise + shippingPaise > toPaise(settings.cod.maxOrderValue)) codReason = "maxValue";

  return {
    ok: true,
    pincode,
    city: listed?.city ?? null,
    state: listed?.state ?? stateFromPincode(pincode) ?? "Other",
    shippingPaise,
    codAvailable: codReason === null,
    codReason,
    etaDays: listed?.etaDays ?? null,
  };
}
