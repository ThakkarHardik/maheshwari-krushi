import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";

/** Store settings kept in the Setting table (editable from the admin panel in Phase 8). */
const schemas = {
  shipping: z.object({
    flatCharge: z.number().nonnegative().default(60),
    freeShippingAbove: z.number().positive().nullable().default(null),
    /** false = deliver only to PIN codes in the ServiceablePincode list. */
    deliverEverywhere: z.boolean().default(false),
  }),
  cod: z.object({
    enabled: z.boolean().default(true),
    maxOrderValue: z.number().positive().default(5000),
    requireOtp: z.boolean().default(false),
  }),
  orders: z.object({
    onlinePaymentExpiryMinutes: z.number().int().positive().default(15),
  }),
};

type Schemas = typeof schemas;
export type SettingKey = keyof Schemas;
export type SettingValue<K extends SettingKey> = z.infer<Schemas[K]>;

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const row = await db.setting.findUnique({ where: { key } });
  const parsed = schemas[key].safeParse(row?.value ?? {});
  // Fall back to defaults if the stored value is malformed.
  return (parsed.success ? parsed.data : schemas[key].parse({})) as SettingValue<K>;
}
