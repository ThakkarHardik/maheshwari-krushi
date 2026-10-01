import { z } from "zod";

/**
 * Normalises an Indian mobile number to its 10 digits: accepts "+91 99933 38008",
 * "09993338008", "919993338008"… Returns null if it isn't a valid mobile (must start 6–9).
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Bots usually submit instantly; real people take a few seconds. */
export const MIN_FILL_MS = 1500;

/** Max enquiries from one mobile number in the rate-limit window. */
export const ENQUIRY_LIMIT = 3;
export const ENQUIRY_WINDOW_MINUTES = 10;

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(60, "tooLong"),
  mobile: z
    .string()
    .transform((v) => normalizeIndianMobile(v))
    .refine((v): v is string => v !== null, "invalidMobile"),
  message: z.string().trim().min(5, "messageRequired").max(1000, "tooLong"),
  productId: z
    .string()
    .max(40)
    .optional()
    .transform((v) => v || null),
  source: z.enum(["FORM", "WHATSAPP"]).default("FORM"),
  /** Honeypot: hidden from people, bots fill it. */
  website: z.string().max(200).optional(),
  /** Date.now() when the form was opened. */
  startedAt: z.coerce.number().int().nonnegative().optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** True when the submission looks automated (honeypot filled or submitted too fast). */
export function looksLikeBot(input: Pick<EnquiryInput, "website" | "startedAt">, now = Date.now()) {
  if (input.website) return true;
  if (input.startedAt === undefined) return false;
  return now - input.startedAt < MIN_FILL_MS;
}

/** The text sent to the store's WhatsApp, signed with the customer's name and number. */
export function composeWhatsAppText(message: string, name: string, mobile: string) {
  return `${message.trim()}\n\n— ${name.trim()}, ${mobile}`;
}
