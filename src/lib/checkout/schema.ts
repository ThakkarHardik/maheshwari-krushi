import { z } from "zod";
import { PINCODE_PATTERN } from "@/lib/delivery";
import { normalizeIndianMobile } from "@/lib/enquiry/schema";

/** Cookie holding the order number this browser just placed (for the success page). */
export const LAST_ORDER_COOKIE = "mk_last_order";

export const PAYMENT_METHODS = ["UPI", "CARD", "COD"] as const;
export type CheckoutPaymentMethod = (typeof PAYMENT_METHODS)[number];

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "tooLong"),
  mobile: z
    .string()
    .transform((v) => normalizeIndianMobile(v))
    .refine((v): v is string => v !== null, "invalidMobile"),
  address: z.string().trim().min(8, "addressRequired").max(300, "tooLong"),
  city: z.string().trim().min(2, "cityRequired").max(60, "tooLong"),
  pincode: z.string().trim().regex(PINCODE_PATTERN, "invalidPincode"),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: "paymentRequired" }),
  note: z
    .string()
    .trim()
    .max(300, "tooLong")
    .optional()
    .transform((v) => v || null),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
