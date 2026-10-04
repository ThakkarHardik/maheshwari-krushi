import { describe, expect, it } from "vitest";
import { discountPercent, formatINR, localized, localizedList } from "../format";
import { listingHref, parseListingParams } from "./listing";
import { categorySchema, fieldErrors, formDataToObject, productSchema, variantSchema } from "./schemas";
import { linesToList, slugify } from "./slug";
import { summarize } from "./summary";
import { nextExpiry, sellableQuantity, totalAvailable } from "./stock";

describe("formatINR", () => {
  it("formats whole rupees without decimals, Indian grouping", () => {
    expect(formatINR(650)).toBe("₹650");
    expect(formatINR("1250")).toBe("₹1,250");
    expect(formatINR(150000)).toBe("₹1,50,000");
  });
  it("keeps paise when present", () => {
    expect(formatINR("650.5")).toBe("₹650.50");
  });
});

describe("discountPercent", () => {
  it("rounds the saving against MRP", () => {
    expect(discountPercent(700, 650)).toBe(7);
    expect(discountPercent("1350", "1250")).toBe(7);
  });
  it("is 0 when there is no saving", () => {
    expect(discountPercent(650, 650)).toBe(0);
    expect(discountPercent(0, 650)).toBe(0);
  });
});

describe("localized", () => {
  it("uses English only when the locale is English and the text exists", () => {
    expect(localized("बीज", "Seeds", "en")).toBe("Seeds");
    expect(localized("बीज", "Seeds", "hi")).toBe("बीज");
    expect(localized("बीज", null, "en")).toBe("बीज");
    expect(localizedList(["फायदा"], [], "en")).toEqual(["फायदा"]);
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs from English names", () => {
    expect(slugify("RUSTAM 99 Cotton Seed")).toBe("rustam-99-cotton-seed");
    expect(slugify("  CSV 33 MF (Fodder) ")).toBe("csv-33-mf-fodder");
  });
  it("drops Devanagari", () => {
    expect(slugify("भिंडी बीज")).toBe("");
    expect(slugify("भिंडी Okra")).toBe("okra");
  });
});

describe("linesToList", () => {
  it("splits lines and strips bullets", () => {
    expect(linesToList("• तेज असर\n\n- सभी फसलों के लिए\r\n✓ उपज में वृद्धि ")).toEqual([
      "तेज असर",
      "सभी फसलों के लिए",
      "उपज में वृद्धि",
    ]);
    expect(linesToList(undefined)).toEqual([]);
  });
});

describe("variantSchema", () => {
  const base = { label: "1 लीटर", sku: "mk-tp-1l", packSize: "1", unit: "LTR", mrp: "700", price: "650" };

  it("accepts a valid pack size and normalises the SKU", () => {
    const result = variantSchema.parse({ ...base, isActive: "on" });
    expect(result.sku).toBe("MK-TP-1L");
    expect(result.isActive).toBe(true);
    expect(result.lowStockThreshold).toBe(5);
  });

  it("treats a missing checkbox as unchecked", () => {
    expect(variantSchema.parse(base).isActive).toBe(false);
  });

  it("rejects a price above MRP", () => {
    const result = variantSchema.safeParse({ ...base, price: "750" });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toEqual({ price: "priceAboveMrp" });
  });

  it("rejects bad amounts and zero", () => {
    for (const mrp of ["abc", "0", "12.345", "-5"]) {
      const result = variantSchema.safeParse({ ...base, mrp });
      expect(result.success).toBe(false);
    }
  });
});

describe("productSchema", () => {
  const base = {
    nameHi: "तार्वर्त पावर",
    slug: "tarvarth-power",
    categoryId: "cat_1",
    hsnCode: "3101",
    gstRate: "5",
  };

  it("parses benefits and blank optionals", () => {
    const result = productSchema.parse({ ...base, nameEn: "", benefitsHi: "a\nb", cropIds: ["c1"] });
    expect(result.nameEn).toBeNull();
    expect(result.benefitsHi).toEqual(["a", "b"]);
    expect(result.cropIds).toEqual(["c1"]);
  });

  it("maps errors to message keys", () => {
    const result = productSchema.safeParse({
      ...base,
      nameHi: "",
      slug: "Bad Slug",
      hsnCode: "12",
      gstRate: "7",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        nameHi: "required",
        slug: "invalidSlug",
        hsnCode: "invalidHsn",
        gstRate: "invalid",
      });
    }
  });
});

describe("categorySchema", () => {
  it("lowercases the slug and defaults sort order", () => {
    expect(categorySchema.parse({ nameHi: "बीज", nameEn: "Seeds", slug: "SEEDS" })).toEqual({
      nameHi: "बीज",
      nameEn: "Seeds",
      slug: "seeds",
      sortOrder: 0,
      isActive: false,
    });
  });
});

describe("formDataToObject", () => {
  it("keeps checkbox groups as arrays and skips Next.js action fields", () => {
    const fd = new FormData();
    fd.append("nameHi", "x");
    fd.append("cropIds", "a");
    fd.append("cropIds", "b");
    fd.append("$ACTION_ID_123", "");
    expect(formDataToObject(fd, ["cropIds", "other"])).toEqual({
      nameHi: "x",
      cropIds: ["a", "b"],
      other: [],
    });
  });
});

describe("listing params", () => {
  it("falls back to safe defaults", () => {
    expect(parseListingParams({ sort: "evil", page: "-3", category: "../x" })).toEqual({
      category: null,
      crop: null,
      sort: "newest",
      q: null,
      page: 1,
    });
  });

  it("parses valid params", () => {
    expect(parseListingParams({ category: "Seeds", sort: "price-asc", q: "  bhindi ", page: "2" })).toEqual({
      category: "seeds",
      crop: null,
      sort: "price-asc",
      q: "bhindi",
      page: 2,
    });
  });

  it("builds short links", () => {
    expect(listingHref({})).toBe("/products");
    expect(listingHref({ category: "seeds", sort: "newest", page: 1 })).toBe("/products?category=seeds");
    expect(listingHref({ q: "भिंडी", sort: "price-desc", page: 3 })).toBe(
      "/products?q=%E0%A4%AD%E0%A4%BF%E0%A4%82%E0%A4%A1%E0%A5%80&sort=price-desc&page=3",
    );
  });
});

describe("stock helpers", () => {
  const now = new Date("2026-10-01");
  const batches = [
    { qtyAvailable: 10, expiryDate: new Date("2027-03-01") },
    { qtyAvailable: 5, expiryDate: new Date("2026-12-01") },
    { qtyAvailable: 7, expiryDate: new Date("2026-09-01") }, // expired
    { qtyAvailable: 0, expiryDate: new Date("2026-11-01") }, // empty
    { qtyAvailable: 3, expiryDate: null },
  ];

  it("sums all stock, or only sellable (unexpired) stock", () => {
    expect(totalAvailable(batches)).toBe(25);
    expect(sellableQuantity(batches, now)).toBe(18);
  });

  it("finds the next expiry among batches that still have stock", () => {
    expect(nextExpiry(batches, now)).toEqual(new Date("2026-12-01"));
    expect(nextExpiry([], now)).toBeNull();
  });
});

describe("crop filter params", () => {
  it("parses and links the crop filter alongside category", () => {
    expect(parseListingParams({ crop: "Cotton", category: "seeds" })).toMatchObject({
      crop: "cotton",
      category: "seeds",
    });
    expect(parseListingParams({ crop: "../etc" }).crop).toBeNull();
    expect(listingHref({ category: "seeds", crop: "cotton" })).toBe("/products?category=seeds&crop=cotton");
  });
});

describe("summarize", () => {
  it("keeps short text and trims long text at a word boundary", () => {
    expect(summarize(null)).toBeNull();
    expect(summarize("  छोटा   विवरण ")).toBe("छोटा विवरण");
    const long =
      "तार्वर्त पावर एक शक्तिशाली प्लांट टॉनिक है जो पौधों की वृद्धि, फूल और फल बनने की प्रक्रिया को तेजी से बढ़ाता है और उपज में वृद्धि करता है।";
    const short = summarize(long)!;
    expect(short.endsWith("…")).toBe(true);
    expect(short.length).toBeLessThanOrEqual(121);
    expect(long.startsWith(short.slice(0, -1))).toBe(true);
  });
});
