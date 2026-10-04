import { expect, test } from "@playwright/test";

test.describe("storefront", () => {
  test("home shows the hero, featured products and policy links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "बेहतरीन उत्पाद, बेहतर फसल" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "अभी उपलब्ध" })).toBeVisible();
    // The spotlight product can be bought straight from the home page.
    await expect(page.locator("#product").getByRole("button", { name: /Add to Cart/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "नियम और शर्तें" })).toBeVisible();
    // No sideways scrolling on any screen size.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("product list filters by category and opens a product", async ({ page }) => {
    await page.goto("/products?category=seeds");
    await expect(page.getByRole("heading", { level: 1, name: "बीज" })).toBeVisible();
    await expect(page.getByText("भिंडी बीज").first()).toBeVisible();
    await expect(page.getByText("CSV 33 MF")).toHaveCount(0);

    await page.goto("/products/bhindi-hybrid-seed");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("भिंडी बीज");
    await expect(page.getByText("(सभी कर सहित)")).toBeVisible();
    await expect(page.getByRole("button", { name: /Add to Cart/ })).toBeEnabled();
  });

  test("language switch shows English", async ({ page }) => {
    await page.goto("/");
    // On phones the language switch lives inside the ☰ menu.
    const menu = page.getByRole("button", { name: "मेनू" });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "EN" }).locator("visible=true").first().click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Better products, better harvest" }),
    ).toBeVisible();
    const menuEn = page.getByRole("button", { name: "Menu" });
    if (await menuEn.isVisible()) await menuEn.click();
    await page.getByRole("button", { name: "हिंदी" }).locator("visible=true").first().click();
    await expect(page.getByRole("heading", { level: 1, name: "बेहतरीन उत्पाद, बेहतर फसल" })).toBeVisible();
  });

  test("policy pages render, unknown pages 404", async ({ page }) => {
    for (const path of ["/terms", "/privacy", "/refund-policy", "/shipping-policy"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await expect(page.getByText("23ACRPM5603Q1Z2").first()).toBeVisible();
    const missing = await page.goto("/products/does-not-exist");
    expect(missing?.status()).toBe(404);
  });
});
