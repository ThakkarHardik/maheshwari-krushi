"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]),
  adminNote: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => v || null),
});

export type EnquiryUpdateState = { ok?: boolean; error?: string };

export async function updateEnquiryAction(
  _prev: EnquiryUpdateState,
  formData: FormData,
): Promise<EnquiryUpdateState> {
  const admin = await requireAdmin("enquiries:manage");
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { id, status, adminNote } = parsed.data;

  const before = await db.enquiry.findUnique({ where: { id }, select: { status: true } });
  if (!before) return { error: "notFound" };

  await db.enquiry.update({ where: { id }, data: { status, adminNote } });
  await writeAudit({
    adminUserId: admin.id,
    action: "enquiry.update",
    entityType: "Enquiry",
    entityId: id,
    meta: { from: before.status, to: status },
  });
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

/** One-click status change from the list (e.g. mark as contacted after calling). */
export async function setEnquiryStatusAction(formData: FormData) {
  const admin = await requireAdmin("enquiries:manage");
  const { id, status } = updateSchema.pick({ id: true, status: true }).parse(Object.fromEntries(formData));
  const before = await db.enquiry.findUnique({ where: { id }, select: { status: true } });
  if (!before || before.status === status) return;
  await db.enquiry.update({ where: { id }, data: { status } });
  await writeAudit({
    adminUserId: admin.id,
    action: "enquiry.update",
    entityType: "Enquiry",
    entityId: id,
    meta: { from: before.status, to: status },
  });
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
}
