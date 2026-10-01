/**
 * URL slug from (English) text: "RUSTAM 99 Cotton Seed" → "rustam-99-cotton-seed".
 * Devanagari is dropped, so pass the English name; returns "" if nothing is left.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Splits a textarea into trimmed, non-empty lines (used for benefit lists). */
export function linesToList(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*✓]+/, "").trim())
    .filter(Boolean);
}
