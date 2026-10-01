import { describe, expect, it } from "vitest";
import { eventForStatus, renderTemplate } from "../notifications/templates";
import { rateLimit } from "../rate-limit";
import { amountInWords, financialYear, formatInvoiceNumber, numberToIndianWords } from "./invoice";
import { allowedNextStatuses, canTransition, NEXT_STATUSES } from "./status";

describe("order status rules", () => {
  it("follows the lifecycle", () => {
    expect(canTransition("PENDING", "CONFIRMED", "OWNER")).toBe(true);
    expect(canTransition("CONFIRMED", "PACKED", "PACKER")).toBe(true);
    expect(canTransition("PACKED", "SHIPPED", "PACKER")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED", "PACKER")).toBe(true);
  });

  it("blocks skipping steps and leaving final states", () => {
    expect(canTransition("PENDING", "SHIPPED", "OWNER")).toBe(false);
    expect(canTransition("DELIVERED", "PENDING", "OWNER")).toBe(false);
    expect(NEXT_STATUSES.CANCELLED).toEqual([]);
    expect(NEXT_STATUSES.RETURNED).toEqual([]);
  });

  it("lets only owner/manager cancel or accept returns", () => {
    expect(canTransition("PENDING", "CANCELLED", "MANAGER")).toBe(true);
    expect(canTransition("PENDING", "CANCELLED", "PACKER")).toBe(false);
    expect(canTransition("DELIVERED", "RETURNED", "PACKER")).toBe(false);
    expect(allowedNextStatuses("PENDING", "PACKER")).toEqual(["CONFIRMED"]);
    expect(allowedNextStatuses("SHIPPED", "OWNER")).toEqual(["DELIVERED", "RETURNED"]);
  });
});

describe("financialYear (IST, April–March)", () => {
  it.each([
    ["2026-04-01T00:00:00+05:30", "2026-27"],
    ["2026-03-31T23:59:00+05:30", "2025-26"],
    ["2026-03-31T19:00:00Z", "2026-27"], // already 1 April 00:30 in India
    ["2027-01-15T10:00:00Z", "2026-27"],
    ["2099-12-01T00:00:00Z", "2099-00"],
  ])("%s → %s", (iso, fy) => {
    expect(financialYear(new Date(iso))).toBe(fy);
  });

  it("formats consecutive invoice numbers", () => {
    expect(formatInvoiceNumber("MKSC", "2026-27", 7)).toBe("MKSC/2026-27/0007");
    expect(formatInvoiceNumber("MKSC", "2026-27", 12345)).toBe("MKSC/2026-27/12345");
  });
});

describe("amount in words (Indian system)", () => {
  it.each([
    [0, "Zero"],
    [15, "Fifteen"],
    [40, "Forty"],
    [2040, "Two Thousand Forty"],
    [100000, "One Lakh"],
    [1250075, "Twelve Lakh Fifty Thousand Seventy Five"],
    [32100000, "Three Crore Twenty One Lakh"],
  ])("%i → %s", (n, words) => {
    expect(numberToIndianWords(n)).toBe(words);
  });

  it("includes paise", () => {
    expect(amountInWords(204000)).toBe("Rupees Two Thousand Forty Only");
    expect(amountInWords(65050)).toBe("Rupees Six Hundred Fifty and Fifty Paise Only");
  });
});

describe("notification templates", () => {
  const vars = { name: "रमेश", orderNumber: "MKSC10006", total: "₹2,040" };

  it("renders customer messages with order details and the store contact", () => {
    const placed = renderTemplate("ORDER_PLACED", vars);
    expect(placed).toContain("रमेश");
    expect(placed).toContain("#MKSC10006");
    expect(placed).toContain("₹2,040");
    expect(placed).toContain("9993338008");
  });

  it("adds courier details only when present", () => {
    expect(renderTemplate("ORDER_SHIPPED", { ...vars, courier: "DTDC", tracking: "D123" })).toContain(
      "DTDC, ट्रैकिंग नंबर D123",
    );
    expect(renderTemplate("ORDER_SHIPPED", vars)).not.toContain("(");
  });

  it("maps statuses to messages", () => {
    expect(eventForStatus("SHIPPED")).toBe("ORDER_SHIPPED");
    expect(eventForStatus("PACKED")).toBeNull();
  });
});

describe("rateLimit", () => {
  it("allows up to the limit per window", () => {
    const key = `test-${Math.random()}`;
    expect([1, 2, 3].map(() => rateLimit(key, 2, 1000, 0))).toEqual([true, true, false]);
    expect(rateLimit(key, 2, 1000, 1001)).toBe(true); // new window
  });
});
