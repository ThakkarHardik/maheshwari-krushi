/**
 * Builds a CSV file that opens correctly in Excel (UTF-8 BOM so Hindi text shows),
 * with quoting, and neutralises spreadsheet formula injection (=, +, -, @ prefixes).
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const cell = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers, ...rows].map((row) => row.map(cell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Paise → "1234.50" for spreadsheets (no currency symbol, no grouping). */
export function csvAmount(paise: number): string {
  return (paise / 100).toFixed(2);
}
