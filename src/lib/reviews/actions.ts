"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { looksLikeBot } from "@/lib/enquiry/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "./schema";
import { isVerifiedBuyer } from "./service";

export type ReviewState = { ok?: boolean; errors?: Record<string, string> };

/**
 * Public action: a customer reviews a product. Only buyers with a delivered order
 * of the product (matched by mobile number) may review, once per product. Reviews
 * are held for approval before they appear.
 */
export async function submitReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`review:${ip}`, 5, 10 * 60_000)) return { errors: { _form: "tooMany" } };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      errors[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
    }
    return { errors };
  }
  const input = parsed.data;
  if (looksLikeBot(input)) return { ok: true };

  if (!(await isVerifiedBuyer(input.productId, input.mobile))) return { errors: { mobile: "notBuyer" } };

  const customer = await db.customer.findUnique({ where: { mobile: input.mobile }, select: { id: true } });
  if (customer) {
    const existing = await db.review.findFirst({
      where: { productId: input.productId, customerId: customer.id },
      select: { id: true },
    });
    if (existing) return { errors: { _form: "alreadyReviewed" } };
  }

  await db.review.create({
    data: {
      productId: input.productId,
      customerId: customer?.id ?? null,
      name: input.name,
      rating: input.rating,
      comment: input.comment,
      status: "PENDING",
    },
  });
  revalidatePath("/admin/reviews");
  return { ok: true };
}
