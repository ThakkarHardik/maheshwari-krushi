import { describe, expect, it } from "vitest";
import {
  composeWhatsAppText,
  enquirySchema,
  looksLikeBot,
  MIN_FILL_MS,
  normalizeIndianMobile,
} from "./schema";

describe("normalizeIndianMobile", () => {
  it.each([
    ["9993338008", "9993338008"],
    ["+91 99933 38008", "9993338008"],
    ["919993338008", "9993338008"],
    ["09993338008", "9993338008"],
    ["99933-38008", "9993338008"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each(["12345", "5993338008", "99933380081", "abcdefghij", "", "+1 415 555 0100"])(
    "rejects %s",
    (input) => {
      expect(normalizeIndianMobile(input)).toBeNull();
    },
  );
});

describe("enquirySchema", () => {
  const valid = { name: "रमेश पटेल", mobile: "+91 98765 43210", message: "भिंडी बीज का रेट बताइए" };

  it("normalises the mobile and defaults the source", () => {
    expect(enquirySchema.parse(valid)).toMatchObject({
      name: "रमेश पटेल",
      mobile: "9876543210",
      source: "FORM",
      productId: null,
    });
  });

  it("returns message keys for each invalid field", () => {
    const result = enquirySchema.safeParse({ name: "r", mobile: "123", message: "hi" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const byField = Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
      expect(byField).toEqual({ name: "nameRequired", mobile: "invalidMobile", message: "messageRequired" });
    }
  });

  it("rejects unknown sources", () => {
    expect(enquirySchema.safeParse({ ...valid, source: "EMAIL" }).success).toBe(false);
  });
});

describe("looksLikeBot", () => {
  const now = 1_000_000;
  it("flags a filled honeypot", () => {
    expect(looksLikeBot({ website: "http://spam.example", startedAt: now - 60_000 }, now)).toBe(true);
  });
  it("flags instant submissions", () => {
    expect(looksLikeBot({ startedAt: now - (MIN_FILL_MS - 1) }, now)).toBe(true);
  });
  it("lets normal submissions through", () => {
    expect(looksLikeBot({ website: "", startedAt: now - 8_000 }, now)).toBe(false);
    expect(looksLikeBot({}, now)).toBe(false);
  });
});

describe("composeWhatsAppText", () => {
  it("signs the message with name and number", () => {
    expect(composeWhatsAppText(" रेट बताइए ", "रमेश", "9876543210")).toBe("रेट बताइए\n\n— रमेश, 9876543210");
  });
});
