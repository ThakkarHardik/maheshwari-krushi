import { z } from "zod";
import { linesToList, SLUG_PATTERN } from "./slug";

export const GST_RATES = ["0", "5", "12", "18", "28"] as const;
export const UNITS = ["GM", "KG", "ML", "LTR", "PIECE", "PACKET"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

const money = z
  .string()
  .trim()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, "invalidAmount")
  .refine((v) => Number(v) > 0, "invalidAmount");

export const categorySchema = z.object({
  nameHi: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().min(1).max(60),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "invalidSlug").max(80),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: checkbox,
});

export const productSchema = z.object({
  nameHi: z.string().trim().min(1).max(120),
  nameEn: optionalText(120),
  subLabelHi: optionalText(80),
  subLabelEn: optionalText(80),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "invalidSlug").max(80),
  categoryId: z.string().min(1),
  descriptionHi: optionalText(5000),
  descriptionEn: optionalText(5000),
  benefitsHi: z.string().max(3000).optional().transform(linesToList),
  benefitsEn: z.string().max(3000).optional().transform(linesToList),
  usageHi: optionalText(3000),
  usageEn: optionalText(3000),
  safetyHi: optionalText(3000),
  manufacturer: optionalText(120),
  licenceNo: optionalText(60),
  hsnCode: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "invalidHsn"),
  gstRate: z.enum(GST_RATES),
  isFeatured: checkbox,
  isActive: checkbox,
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  cropIds: z.array(z.string().min(1)).max(50).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const variantSchema = z
  .object({
    label: z.string().trim().min(1).max(40),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{1,39}$/, "invalidSku"),
    packSize: z
      .string()
      .trim()
      .regex(/^\d{1,7}(\.\d{1,3})?$/, "invalidPackSize")
      .refine((v) => Number(v) > 0, "invalidPackSize"),
    unit: z.enum(UNITS),
    mrp: money,
    price: money,
    lowStockThreshold: z.coerce.number().int().min(0).max(100000).default(5),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    isActive: checkbox,
  })
  .refine((v) => Number(v.price) <= Number(v.mrp), { message: "priceAboveMrp", path: ["price"] });

export type VariantInput = z.infer<typeof variantSchema>;

/** Reads a FormData into a plain object, keeping repeated keys (checkbox groups) as arrays. */
export function formDataToObject(formData: FormData, arrayKeys: readonly string[] = []) {
  const result: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = formData.getAll(key).filter((v): v is string => typeof v === "string");
    result[key] = arrayKeys.includes(key) ? values : values[0];
  }
  for (const key of arrayKeys) result[key] ??= [];
  return result;
}

/**
 * First error per field as a message key (see `admin.errors` in messages/*.json).
 * Our own messages are single camelCase words; Zod's built-in ones are mapped.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (out[key]) continue;
    if (/^[a-zA-Z]+$/.test(issue.message)) out[key] = issue.message;
    else if (issue.code === "too_small") out[key] = "required";
    else if (issue.code === "too_big") out[key] = "tooLong";
    else out[key] = "invalid";
  }
  return out;
}
