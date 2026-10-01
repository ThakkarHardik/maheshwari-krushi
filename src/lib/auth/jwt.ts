import { jwtVerify, SignJWT } from "jose";
import type { AdminRole } from "@/generated/prisma/enums";

/** Edge-safe session token helpers (used by middleware and server code). */

export const SESSION_COOKIE = "mk_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  sub: string;
  role: AdminRole;
  /** AdminUser.sessionVersion at sign-in time. */
  sv: number;
};

function getKey(secret = process.env.AUTH_SECRET): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, secret?: string): Promise<string> {
  return new SignJWT({ role: payload.role, sv: payload.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey(secret));
}

export async function verifySession(
  token: string | undefined,
  secret?: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(secret), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.sv !== "number") return null;
    return { sub: payload.sub, role: payload.role as AdminRole, sv: payload.sv };
  } catch {
    return null;
  }
}

/** Only allow redirects back into the admin panel (prevents open redirects). */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) {
    return "/admin";
  }
  if (next.startsWith("/admin/login")) return "/admin";
  return next;
}
