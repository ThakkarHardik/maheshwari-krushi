import { expect, test } from "@playwright/test";

test.describe("security basics", () => {
  test("pages send security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("private pages are not cached and admin is hidden from search engines", async ({ request }) => {
    expect((await request.get("/cart")).headers()["cache-control"]).toContain("no-store");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap:");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/products/bhindi-hybrid-seed");
    expect(sitemap).not.toContain("/admin");
  });

  test("admin data and exports need a login", async ({ request }) => {
    const csv = await request.get("/admin/reports/export?type=gst", { maxRedirects: 0 });
    expect([302, 303, 307, 403]).toContain(csv.status());
    const upload = await request.get("/uploads/products/..%2F..%2F.env");
    expect(upload.status()).toBe(404);
  });

  test("health check responds without leaking details", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
