"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { categorySchema, fieldErrors, formDataToObject } from "@/lib/catalog/schemas";
import { db } from "@/lib/db";

export type CategoryFormState = { ok?: boolean; errors?: Record<string, string> };

export async function saveCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const admin = await requireAdmin("products:manage");
  const id = (formData.get("id") as string | null) || null;
  const parsed = categorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const clash = await db.category.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) return { errors: { slug: "slugTaken" } };

  const saved = id ? await db.category.update({ where: { id }, data }) : await db.category.create({ data });

  await writeAudit({
    adminUserId: admin.id,
    action: id ? "category.update" : "category.create",
    entityType: "Category",
    entityId: saved.id,
    meta: { slug: saved.slug, isActive: saved.isActive },
  });
  revalidatePath("/admin/categories");
  return { ok: true };
}
