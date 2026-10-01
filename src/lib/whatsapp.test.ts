import { describe, expect, it } from "vitest";
import { storeConfig } from "@/config/store";
import { buildWhatsAppLink } from "./whatsapp";

describe("buildWhatsAppLink", () => {
  it("builds a plain link for the store number", () => {
    expect(buildWhatsAppLink(storeConfig.whatsapp)).toBe("https://wa.me/919993338008");
  });

  it("URL-encodes a Hindi message", () => {
    const link = buildWhatsAppLink("919993338008", "नमस्ते, भिंडी बीज?");
    expect(link.startsWith("https://wa.me/919993338008?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("नमस्ते, भिंडी बीज?");
  });

  it("strips formatting characters", () => {
    expect(buildWhatsAppLink("+91 99933-38008")).toBe("https://wa.me/919993338008");
  });

  it("rejects invalid numbers", () => {
    expect(() => buildWhatsAppLink("12345")).toThrow();
  });
});
