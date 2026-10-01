export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB
export const MAX_IMAGES_PER_PRODUCT = 8;

export type ImageKind = { ext: "jpg" | "png" | "webp"; mime: string };

/** Detects the real image type from the file's first bytes (never trust the browser's MIME type). */
export function detectImageType(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) {
    return { ext: "png", mime: "image/png" };
  }
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export type ImageCheck =
  { ok: true; kind: ImageKind } | { ok: false; error: "empty" | "tooLarge" | "badType" };

export function checkImage(bytes: Uint8Array): ImageCheck {
  if (bytes.length === 0) return { ok: false, error: "empty" };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "tooLarge" };
  const kind = detectImageType(bytes);
  return kind ? { ok: true, kind } : { ok: false, error: "badType" };
}

/** Local upload file names: a random id plus a known extension — nothing else. */
export const LOCAL_FILE_PATTERN = /^[a-z0-9]{16,40}\.(jpg|png|webp)$/;
