import { expect, test } from "@playwright/test";

test("a farmer buys seeds with Cash on Delivery and tracks the order", async ({ page }) => {
  await page.goto("/products/bhindi-hybrid-seed");
  await page.getByRole("button", { name: "मात्रा बढ़ाएं" }).click();
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await expect(page.getByText("कार्ट में जोड़ दिया गया।")).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1, name: "आपका कार्ट" })).toBeVisible();
  await expect(page.getByText("भिंडी बीज")).toBeVisible();
  await page.getByRole("link", { name: "चेकआउट करें" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  // Submitting empty shows field errors in Hindi.
  await page.getByRole("button", { name: "ऑर्डर कन्फर्म करें" }).click();
  await expect(page.getByText("पूरा नाम लिखें।")).toBeVisible();

  const mobile = `98${String(Date.now()).slice(-8)}`;
  await page.getByLabel("पूरा नाम*").fill("ई2ई टेस्ट किसान");
  await page.getByLabel("मोबाइल नंबर*").fill(mobile);
  await page.getByLabel("पता*").fill("वार्ड 3, गांधी चौक, सैलाना");
  await page.getByLabel("पिनकोड*").fill("457550");
  await expect(page.getByText(/डिलीवरी उपलब्ध/)).toBeVisible();
  await expect(page.getByLabel("शहर / गाँव*")).toHaveValue("Sailana");
  await expect(page.getByText("पूरा नाम लिखें।")).toHaveCount(0);
  await expect(page.getByLabel("कैश ऑन डिलीवरी (COD)")).toBeChecked();

  await page.getByRole("button", { name: "ऑर्डर कन्फर्म करें" }).click();
  await expect(page).toHaveURL(/\/order\/success$/);
  await expect(page.getByRole("heading", { name: /धन्यवाद/ })).toBeVisible();
  const orderNumber = (await page.locator("strong", { hasText: /^#MKSC\d+$/ }).textContent())!.replace(
    "#",
    "",
  );

  // Cart is empty after ordering.
  await page.goto("/cart");
  await expect(page.getByText("आपका कार्ट खाली है।")).toBeVisible();

  // Track with the wrong mobile, then the right one.
  await page.goto(`/track?order=${orderNumber}`);
  await page.getByLabel("मोबाइल नंबर*").fill("9000000000");
  await page.getByRole("button", { name: "स्थिति देखें" }).click();
  await expect(page.getByText(/कोई ऑर्डर नहीं मिला/)).toBeVisible();
  await page.getByLabel("मोबाइल नंबर*").fill(mobile);
  await page.getByRole("button", { name: "स्थिति देखें" }).click();
  await expect(page.getByRole("heading", { name: `#${orderNumber}` })).toBeVisible();
  await expect(page.getByText("ऑर्डर मिला")).toBeVisible();
});

test("an unserviceable PIN code is refused at checkout", async ({ page }) => {
  await page.goto("/products/bhindi-hybrid-seed");
  await page.getByRole("button", { name: /Buy Now/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("पिनकोड*").fill("400001");
  await expect(page.getByText(/इस पिनकोड पर अभी डिलीवरी नहीं होती/)).toBeVisible();
});
