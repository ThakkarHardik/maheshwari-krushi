"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recomputeRating } from "@/lib/reviews/service";

const schema = z.object({ id: z.string().min(1).max(40), status: z.enum(["APPROVED", "HIDDEN"]) });

export async function setReviewStatusAction(formData: FormData) {
  const admin = await requireAdmin("reviews:manage");
  const { id, status } = schema.parse(Object.fromEntries(formData));
  const review = await db.review.update({
    where: { id },
    data: { status },
    select: { productId: true, product: { select: { slug: true } } },
  });
  await recomputeRating(review.productId);
  await writeAudit({
    adminUserId: admin.id,
    action: `review.${status.toLowerCase()}`,
    entityType: "Review",
    entityId: id,
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.product.slug}`);
  revalidatePath("/products");
}
