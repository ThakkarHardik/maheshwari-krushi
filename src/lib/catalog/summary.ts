const SUMMARY_LENGTH = 120;

/** Shortens a description to about two lines, cutting at a word boundary. */
export function summarize(text: string | null): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= SUMMARY_LENGTH) return clean;
  const cut = clean.slice(0, SUMMARY_LENGTH);
  const space = cut.lastIndexOf(" ");
  return `${space > 60 ? cut.slice(0, space) : cut}…`;
}
