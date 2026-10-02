import "server-only";
import { db } from "@/lib/db";
import { averageRating } from "./schema";

/** Recomputes a product's star rating from its APPROVED reviews. */
export async function recomputeRating(productId: string) {
  const approved = await db.review.findMany({
    where: { productId, status: "APPROVED" },
    select: { rating: true },
  });
  const { avg, count } = averageRating(approved.map((r) => r.rating));
  await db.product.update({ where: { id: productId }, data: { ratingAvg: avg, ratingCount: count } });
}

/** True when this mobile number has a delivered order containing the product. */
export async function isVerifiedBuyer(productId: string, mobile: string) {
  const match = await db.orderItem.findFirst({
    where: { variant: { productId }, order: { shipMobile: mobile, status: "DELIVERED" } },
    select: { id: true },
  });
  return match !== null;
}
