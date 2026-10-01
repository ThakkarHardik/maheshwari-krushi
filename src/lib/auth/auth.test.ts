import { describe, expect, it } from "vitest";
import { safeAdminRedirect, signSession, verifySession } from "./jwt";
import { afterFailedLogin, isLocked, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from "./lockout";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";
import { hasPermission } from "./roles";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

describe("roles", () => {
  it("gives the owner every permission", () => {
    expect(hasPermission("OWNER", "staff:manage")).toBe(true);
    expect(hasPermission("OWNER", "settings:manage")).toBe(true);
    expect(hasPermission("OWNER", "orders:refund")).toBe(true);
  });

  it("lets a manager run the shop but not manage staff or settings", () => {
    expect(hasPermission("MANAGER", "products:manage")).toBe(true);
    expect(hasPermission("MANAGER", "inventory:manage")).toBe(true);
    expect(hasPermission("MANAGER", "staff:manage")).toBe(false);
    expect(hasPermission("MANAGER", "settings:manage")).toBe(false);
  });

  it("limits a packer to viewing and updating orders", () => {
    expect(hasPermission("PACKER", "orders:view")).toBe(true);
    expect(hasPermission("PACKER", "orders:update-status")).toBe(true);
    expect(hasPermission("PACKER", "orders:refund")).toBe(false);
    expect(hasPermission("PACKER", "products:manage")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ sub: "admin_1", role: "MANAGER", sv: 3 }, SECRET);
    await expect(verifySession(token, SECRET)).resolves.toEqual({ sub: "admin_1", role: "MANAGER", sv: 3 });
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSession({ sub: "admin_1", role: "OWNER", sv: 1 }, SECRET);
    await expect(verifySession(token, `${SECRET}-other`)).resolves.toBeNull();
  });

  it("rejects missing and tampered tokens", async () => {
    const token = await signSession({ sub: "admin_1", role: "PACKER", sv: 1 }, SECRET);
    await expect(verifySession(undefined, SECRET)).resolves.toBeNull();
    await expect(verifySession(`${token.slice(0, -2)}xx`, SECRET)).resolves.toBeNull();
  });

  it("refuses a short secret", async () => {
    await expect(signSession({ sub: "a", role: "OWNER", sv: 1 }, "short")).rejects.toThrow(/AUTH_SECRET/);
  });
});

describe("safeAdminRedirect", () => {
  it.each([
    [undefined, "/admin"],
    ["/admin/staff", "/admin/staff"],
    ["/admin?x=1", "/admin?x=1"],
    ["https://evil.example", "/admin"],
    ["//evil.example/admin", "/admin"],
    ["/admin\\..\\evil", "/admin"],
    ["/products", "/admin"],
    ["/admin/login", "/admin"],
  ])("%s → %s", (input, expected) => {
    expect(safeAdminRedirect(input)).toBe(expected);
  });
});

describe("login lockout", () => {
  const now = new Date("2026-10-01T10:00:00Z");

  it("keeps counting below the limit", () => {
    expect(afterFailedLogin(MAX_FAILED_LOGINS - 1, now)).toEqual({
      locked: false,
      failedLoginAttempts: MAX_FAILED_LOGINS - 1,
      lockedUntil: null,
    });
  });

  it("locks for 15 minutes at the limit and resets the counter", () => {
    const result = afterFailedLogin(MAX_FAILED_LOGINS, now);
    expect(result.locked).toBe(true);
    expect(result.failedLoginAttempts).toBe(0);
    expect(result.lockedUntil?.getTime()).toBe(now.getTime() + LOCKOUT_MINUTES * 60_000);
  });

  it("reports whether a lock is still active", () => {
    expect(isLocked(null, now)).toBe(false);
    expect(isLocked(new Date(now.getTime() + 1000), now)).toBe(true);
    expect(isLocked(new Date(now.getTime() - 1000), now)).toBe(false);
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("has a valid dummy hash for timing equalisation", async () => {
    expect(await verifyPassword("anything", DUMMY_HASH)).toBe(false);
  });
});
