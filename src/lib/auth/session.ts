import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "./roles";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./jwt";

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * The signed-in admin, re-checked against the database on every request so a
 * deactivated user or changed password takes effect immediately.
 */
export const getCurrentAdmin = cache(async () => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, isActive: true, sessionVersion: true },
  });
  if (!admin || !admin.isActive || admin.sessionVersion !== session.sv) return null;

  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
});

export type CurrentAdmin = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>;

/** Use at the top of every admin page and server action. */
export async function requireAdmin(permission?: Permission): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !hasPermission(admin.role, permission)) redirect("/admin?denied=1");
  return admin;
}
