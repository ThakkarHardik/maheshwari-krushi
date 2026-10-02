import { expect, test, type Page } from "@playwright/test";

const email = process.env.SEED_OWNER_EMAIL ?? "maheshwariksksailana@gmail.com";
const password = process.env.SEED_OWNER_PASSWORD ?? "";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("ईमेल").fill(email);
  await page.getByLabel("पासवर्ड").fill(password);
  await page.getByRole("button", { name: "लॉगिन करें" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("admin", () => {
  test.skip(!password, "SEED_OWNER_PASSWORD is not set");

  test("admin pages need a login", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Forders/);
  });

  test("wrong password is refused", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("ईमेल").fill(email);
    await page.getByLabel("पासवर्ड").fill("definitely-wrong");
    await page.getByRole("button", { name: "लॉगिन करें" }).click();
    await expect(page.getByText("ईमेल या पासवर्ड गलत है।")).toBeVisible();
  });

  test("owner confirms and packs the newest order, then prints the invoice", async ({ page }) => {
    await login(page);
    await page.goto("/admin/orders?status=PENDING");
    const first = page.locator("tbody tr").first().getByRole("link");
    test.skip((await first.count()) === 0, "no pending orders — run checkout.spec first");
    await first.click();

    await page.getByRole("button", { name: "ऑर्डर कन्फर्म करें" }).click();
    await expect(page.getByRole("button", { name: "पैक हो गया" })).toBeVisible();
    await page.getByRole("button", { name: "पैक हो गया" }).click();
    await expect(page.getByText(/बिल नंबर: MKSC\/\d{4}-\d{2}\/\d{4,}/)).toBeVisible();

    const invoice = page.waitForEvent("popup");
    await page.getByRole("link", { name: "GST बिल प्रिंट करें" }).click();
    const invoicePage = await invoice;
    await expect(invoicePage.getByText("टैक्स इनवॉइस (GST बिल)")).toBeVisible();
    await expect(invoicePage.getByText("23ACRPM5603Q1Z2")).toBeVisible();
  });

  test("owner sees reports and settings", async ({ page }) => {
    await login(page);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "GST सारांश (HSN अनुसार)" })).toBeVisible();
    const csv = await page.request.get("/admin/reports/export?type=gst");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "डिलीवरी पिनकोड" })).toBeVisible();
  });
});
