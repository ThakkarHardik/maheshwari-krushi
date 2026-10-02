"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PINCODE_PATTERN } from "@/lib/delivery";
import { saveSetting } from "@/lib/settings";

export type SettingsState = { ok?: boolean; errors?: Record<string, string> };

const amount = (msg = "invalidAmount") =>
  z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, msg)
    .transform(Number);
const optionalAmount = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{1,7}(\.\d{1,2})?$/.test(v), "invalidAmount")
  .transform((v) => (v === null ? null : Number(v)));
const checkbox = z
  .literal("on")
  .optional()
  .transform((v) => v === "on");

function toErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
  }
  return out;
}

function revalidateStore() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

const shippingSchema = z.object({
  flatCharge: amount(),
  freeShippingAbove: optionalAmount.refine((v) => v === null || v > 0, "invalidAmount"),
  deliverEverywhere: checkbox,
});

export async function saveShippingAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin("settings:manage");
  const parsed = shippingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: toErrors(parsed.error.issues) };
  const saved = await saveSetting("shipping", parsed.data);
  await writeAudit({
    adminUserId: admin.id,
    action: "settings.shipping",
    entityType: "Setting",
    entityId: "shipping",
    meta: saved,
  });
  revalidateStore();
  return { ok: true };
}

const codSchema = z.object({
  enabled: checkbox,
  maxOrderValue: amount().refine((v) => v > 0, "invalidAmount"),
});

export async function saveCodAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin("settings:manage");
  const parsed = codSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: toErrors(parsed.error.issues) };
  // OTP for COD orders isn't offered yet, so it stays off.
  const saved = await saveSetting("cod", { ...parsed.data, requireOtp: false });
  await writeAudit({
    adminUserId: admin.id,
    action: "settings.cod",
    entityType: "Setting",
    entityId: "cod",
    meta: saved,
  });
  revalidateStore();
  return { ok: true };
}

const pincodeSchema = z.object({
  pincode: z.string().trim().regex(PINCODE_PATTERN, "invalidPincode"),
  city: z.string().trim().min(2, "required").max(60),
  district: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || null),
  deliveryCharge: optionalAmount,
  codAllowed: checkbox,
  etaDays: z.coerce.number().int("invalidEta").min(1, "invalidEta").max(30, "invalidEta"),
  isActive: checkbox,
});

export async function savePincodeAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin("settings:manage");
  const parsed = pincodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: toErrors(parsed.error.issues) };
  const { pincode, ...data } = parsed.data;
  const row = { ...data, deliveryCharge: data.deliveryCharge === null ? null : String(data.deliveryCharge) };
  await db.serviceablePincode.upsert({ where: { pincode }, update: row, create: { pincode, ...row } });
  await writeAudit({
    adminUserId: admin.id,
    action: "settings.pincode",
    entityType: "ServiceablePincode",
    entityId: pincode,
    meta: { ...row },
  });
  revalidateStore();
  return { ok: true };
}
