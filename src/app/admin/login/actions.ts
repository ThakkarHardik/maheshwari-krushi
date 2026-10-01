"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { safeAdminRedirect } from "@/lib/auth/jwt";
import { afterFailedLogin, isLocked } from "@/lib/auth/lockout";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, createSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
  next: z.string().max(500).optional(),
});

export type LoginState = { error?: "invalid" | "locked" };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "invalid" };
  const { email, password, next } = parsed.data;

  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) {
    await verifyPassword(password, DUMMY_HASH); // equalise response time
    return { error: "invalid" };
  }
  if (isLocked(admin.lockedUntil)) return { error: "locked" };

  if (!(await verifyPassword(password, admin.passwordHash))) {
    const { failedLoginAttempts } = await db.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    const outcome = afterFailedLogin(failedLoginAttempts);
    if (outcome.locked) {
      await db.adminUser.update({
        where: { id: admin.id },
        data: { failedLoginAttempts: outcome.failedLoginAttempts, lockedUntil: outcome.lockedUntil },
      });
    }
    await writeAudit({
      adminUserId: admin.id,
      action: outcome.locked ? "auth.locked" : "auth.login_failed",
      entityType: "AdminUser",
      entityId: admin.id,
    });
    return { error: outcome.locked ? "locked" : "invalid" };
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await createSessionCookie({ sub: admin.id, role: admin.role, sv: admin.sessionVersion });
  await writeAudit({
    adminUserId: admin.id,
    action: "auth.login",
    entityType: "AdminUser",
    entityId: admin.id,
  });

  redirect(safeAdminRedirect(next));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
