"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ENQUIRY_LIMIT, ENQUIRY_WINDOW_MINUTES, enquirySchema, looksLikeBot } from "./schema";

export type EnquiryState = {
  ok?: boolean;
  errors?: Record<string, string>;
};

function firstErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
  }
  return out;
}

/** Public action: saves a customer enquiry from the product page or contact page. */
export async function submitEnquiryAction(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: firstErrors(parsed.error.issues) };
  const input = parsed.data;

  // Pretend success to bots so they don't retry.
  if (looksLikeBot(input)) return { ok: true };

  const since = new Date(Date.now() - ENQUIRY_WINDOW_MINUTES * 60_000);
  const recent = await db.enquiry.count({ where: { mobile: input.mobile, createdAt: { gte: since } } });
  if (recent >= ENQUIRY_LIMIT) return { errors: { _form: "tooMany" } };

  const [product, customer] = await Promise.all([
    input.productId
      ? db.product.findFirst({ where: { id: input.productId, deletedAt: null }, select: { id: true } })
      : null,
    db.customer.findUnique({ where: { mobile: input.mobile }, select: { id: true } }),
  ]);

  await db.enquiry.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      message: input.message,
      source: input.source,
      productId: product?.id ?? null,
      customerId: customer?.id ?? null,
    },
  });
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  return { ok: true };
}
