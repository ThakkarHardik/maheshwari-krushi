type Numeric = number | string | { toString(): string };

function toNumber(value: Numeric): number {
  return typeof value === "number" ? value : Number(value.toString());
}

/** "₹1,250" — or "₹1,250.50" when there are paise. */
export function formatINR(value: Numeric): string {
  const amount = toNumber(value);
  const hasPaise = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Whole-number discount percentage of price against MRP, or 0. */
export function discountPercent(mrp: Numeric, price: Numeric): number {
  const m = toNumber(mrp);
  const p = toNumber(price);
  if (!(m > 0) || p >= m) return 0;
  return Math.round(((m - p) / m) * 100);
}

/** Picks the English text when the locale is English and it exists. */
export function localized(hi: string, en: string | null | undefined, locale: string): string;
export function localized(
  hi: string | null | undefined,
  en: string | null | undefined,
  locale: string,
): string | null;
export function localized(hi: string | null | undefined, en: string | null | undefined, locale: string) {
  if (locale === "en" && en) return en;
  return hi ?? en ?? null;
}

export function localizedList(hi: string[], en: string[], locale: string): string[] {
  return locale === "en" && en.length > 0 ? en : hi;
}
