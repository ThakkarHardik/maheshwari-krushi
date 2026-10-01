import { describe, expect, it } from "vitest";
import { checkImage, detectImageType, LOCAL_FILE_PATTERN, MAX_IMAGE_BYTES } from "./image";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by their bytes", () => {
    expect(detectImageType(jpeg)?.ext).toBe("jpg");
    expect(detectImageType(png)?.ext).toBe("png");
    expect(detectImageType(webp)?.ext).toBe("webp");
  });

  it("rejects other files, even if renamed", () => {
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBeNull();
  });
});

describe("checkImage", () => {
  it("rejects empty and oversized files", () => {
    expect(checkImage(new Uint8Array())).toEqual({ ok: false, error: "empty" });
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(jpeg);
    expect(checkImage(big)).toEqual({ ok: false, error: "tooLarge" });
  });

  it("accepts a valid image", () => {
    expect(checkImage(png)).toMatchObject({ ok: true, kind: { ext: "png" } });
  });
});

describe("LOCAL_FILE_PATTERN", () => {
  it("only allows generated file names", () => {
    expect(LOCAL_FILE_PATTERN.test("0a1b2c3d4e5f6a7b8c9d0e1f.jpg")).toBe(true);
    expect(LOCAL_FILE_PATTERN.test("../../.env")).toBe(false);
    expect(LOCAL_FILE_PATTERN.test("abc.jpg")).toBe(false);
    expect(LOCAL_FILE_PATTERN.test("0a1b2c3d4e5f6a7b8c9d0e1f.svg")).toBe(false);
  });
});
