import { z } from "zod";
import { normalizeIndianMobile } from "@/lib/enquiry/schema";

export const reviewSchema = z.object({
  productId: z.string().min(1).max(40),
  name: z.string().trim().min(2, "nameRequired").max(60, "tooLong"),
  mobile: z
    .string()
    .transform((v) => normalizeIndianMobile(v))
    .refine((v): v is string => v !== null, "invalidMobile"),
  rating: z.coerce.number().int("ratingRequired").min(1, "ratingRequired").max(5, "ratingRequired"),
  comment: z
    .string()
    .trim()
    .max(1000, "tooLong")
    .optional()
    .transform((v) => v || null),
  /** Honeypot (hidden from people). */
  website: z.string().max(200).optional(),
  startedAt: z.coerce.number().int().nonnegative().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

/** Average rounded to 2 decimals (stored as Decimal(3,2)); 0 when there are no reviews. */
export function averageRating(ratings: number[]): { avg: number; count: number } {
  if (ratings.length === 0) return { avg: 0, count: 0 };
  const sum = ratings.reduce((s, r) => s + r, 0);
  return { avg: Math.round((sum / ratings.length) * 100) / 100, count: ratings.length };
}
