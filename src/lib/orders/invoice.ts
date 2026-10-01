/** GST invoice helpers (pure). */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Indian financial year (April–March) for a moment in time, in IST: "2026-27". */
export function financialYear(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? year : year - 1; // April = month 3
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** "MKSC/2026-27/0001" — consecutive within a financial year, as GST requires. */
export function formatInvoiceNumber(prefix: string, fy: string, serial: number): string {
  return `${prefix}/${fy}/${String(serial).padStart(4, "0")}`;
}

export function invoiceCounterKey(fy: string): string {
  return `invoice-${fy}`;
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/** Whole number in words, Indian system (thousand, lakh, crore). */
export function numberToIndianWords(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  return [
    crore ? `${numberToIndianWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    n ? belowThousand(n) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** "Rupees Two Thousand Forty and Fifty Paise Only" for an amount in paise. */
export function amountInWords(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  return `Rupees ${numberToIndianWords(rupees)}${p ? ` and ${belowHundred(p)} Paise` : ""} Only`;
}
