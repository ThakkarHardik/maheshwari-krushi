import { describe, expect, it } from "vitest";
import { validateEnv } from "./env";

const base = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(40),
};

describe("validateEnv", () => {
  it("accepts a valid development setup with defaults", () => {
    expect(validateEnv(base)).toMatchObject({ NODE_ENV: "development", STORAGE_DRIVER: "local" });
  });

  it("rejects a short secret and a missing database URL", () => {
    expect(() => validateEnv({ AUTH_SECRET: "short" })).toThrow(/DATABASE_URL[\s\S]*AUTH_SECRET/);
  });

  it("requires Cloudinary keys when Cloudinary storage is selected", () => {
    expect(() => validateEnv({ ...base, STORAGE_DRIVER: "cloudinary" })).toThrow(/CLOUDINARY_CLOUD_NAME/);
  });

  it("enforces production rules on Vercel", () => {
    const prod = { ...base, NODE_ENV: "production", VERCEL: "1" };
    expect(() => validateEnv(prod)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => validateEnv({ ...prod, NEXT_PUBLIC_SITE_URL: "http://shop.example.in" })).toThrow(/https/);
    expect(() => validateEnv({ ...prod, NEXT_PUBLIC_SITE_URL: "https://shop.example.in" })).toThrow(
      /STORAGE_DRIVER/,
    );
    expect(
      validateEnv({
        ...prod,
        NEXT_PUBLIC_SITE_URL: "https://shop.example.in",
        STORAGE_DRIVER: "cloudinary",
        CLOUDINARY_CLOUD_NAME: "c",
        CLOUDINARY_API_KEY: "k",
        CLOUDINARY_API_SECRET: "s",
      }).NODE_ENV,
    ).toBe("production");
  });
});
