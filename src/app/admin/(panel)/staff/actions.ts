"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(ADMIN_ROLES),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export type CreateStaffState = { ok?: boolean; error?: "invalid" | "emailTaken" };

export async function createStaffAction(
  _prev: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const admin = await requireAdmin("staff:manage");
  const parsed = createStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { name, email, role, password } = parsed.data;

  if (await db.adminUser.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "emailTaken" };
  }

  const created = await db.adminUser.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
  });
  await writeAudit({
    adminUserId: admin.id,
    action: "staff.create",
    entityType: "AdminUser",
    entityId: created.id,
    meta: { email, role },
  });
  revalidatePath("/admin/staff");
  return { ok: true };
}

const setActiveSchema = z.object({
  id: z.string().min(1),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function setStaffActiveAction(formData: FormData) {
  const admin = await requireAdmin("staff:manage");
  const parsed = setActiveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/staff");
  const { id, active } = parsed.data;

  if (id === admin.id) redirect("/admin/staff?error=cannotChangeSelf");

  const target = await db.adminUser.findUnique({ where: { id }, select: { role: true } });
  if (!target) redirect("/admin/staff");

  if (!active && target.role === "OWNER") {
    const otherOwners = await db.adminUser.count({
      where: { role: "OWNER", isActive: true, id: { not: id } },
    });
    if (otherOwners === 0) redirect("/admin/staff?error=lastOwner");
  }

  await db.adminUser.update({
    where: { id },
    // Deactivating bumps sessionVersion so any open session ends immediately.
    data: active ? { isActive: true } : { isActive: false, sessionVersion: { increment: 1 } },
  });
  await writeAudit({
    adminUserId: admin.id,
    action: active ? "staff.activate" : "staff.deactivate",
    entityType: "AdminUser",
    entityId: id,
  });
  revalidatePath("/admin/staff");
}
