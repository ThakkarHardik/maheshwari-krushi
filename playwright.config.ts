import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build: `npm run test:e2e`.
 * They place real orders, so — like the integration tests — they only run
 * against a local database unless ALLOW_DB_TESTS=1 (never production).
 */
const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url) && process.env.ALLOW_DB_TESTS !== "1") {
  throw new Error(
    "Refusing to run e2e tests against a non-local DATABASE_URL. Set ALLOW_DB_TESTS=1 for a test database.",
  );
}

const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // tests share one database and one cart cookie per context
  retries: 0,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "hi-IN",
    timezoneId: "Asia/Kolkata",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /storefront|checkout/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
