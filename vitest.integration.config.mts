import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against the real database in DATABASE_URL: `npm run test:int`.
 * They consume order and invoice numbers, so they refuse to run against a
 * non-local database unless ALLOW_DB_TESTS=1 (use a separate test database, never production).
 */
const url = process.env.DATABASE_URL ?? "";
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!isLocal && process.env.ALLOW_DB_TESTS !== "1") {
  throw new Error("Refusing to run integration tests against a non-local DATABASE_URL. Set ALLOW_DB_TESTS=1 for a dedicated test database.");
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
