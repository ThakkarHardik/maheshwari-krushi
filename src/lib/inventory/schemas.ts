import { z } from "zod";
import { ADJUSTMENT_TYPES } from "./rules";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      ctx.addIssue({ code: "custom", message: "invalidDate" });
      return z.NEVER;
    }
    const date = new Date(`${v}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== v) {
      ctx.addIssue({ code: "custom", message: "invalidDate" });
      return z.NEVER;
    }
    return date;
  });

export const receiveStockSchema = z
  .object({
    variantId: z.string().min(1),
    batchNo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9/._-]{0,39}$/, "invalidBatchNo"),
    quantity: z.coerce
      .number()
      .int("invalidQuantity")
      .min(1, "invalidQuantity")
      .max(1_000_000, "invalidQuantity"),
    mfgDate: optionalDate,
    expiryDate: optionalDate,
    costPrice: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^\d{1,8}(\.\d{1,2})?$/.test(v), "invalidAmount"),
    supplier: z
      .string()
      .trim()
      .max(120, "tooLong")
      .optional()
      .transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    if (v.mfgDate && v.mfgDate > new Date()) {
      ctx.addIssue({ code: "custom", message: "mfgInFuture", path: ["mfgDate"] });
    }
    // Mfg can't be in the future, so an expiry before mfg is also in the past — report the more specific error.
    if (v.expiryDate && v.mfgDate && v.expiryDate <= v.mfgDate) {
      ctx.addIssue({ code: "custom", message: "expiryBeforeMfg", path: ["expiryDate"] });
    } else if (v.expiryDate && v.expiryDate <= new Date()) {
      ctx.addIssue({ code: "custom", message: "expiryPast", path: ["expiryDate"] });
    }
  });

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;

export const adjustStockSchema = z
  .object({
    batchId: z.string().min(1),
    type: z.enum(ADJUSTMENT_TYPES),
    quantity: z.coerce
      .number()
      .int("invalidQuantity")
      .min(-1_000_000, "invalidQuantity")
      .max(1_000_000, "invalidQuantity")
      .refine((n) => n !== 0, "invalidQuantity"),
    reason: z.string().trim().min(3, "reasonRequired").max(300, "tooLong"),
  })
  .superRefine((v, ctx) => {
    if (v.type !== "ADJUSTMENT" && v.quantity < 0) {
      ctx.addIssue({ code: "custom", message: "positiveOnly", path: ["quantity"] });
    }
  });

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
