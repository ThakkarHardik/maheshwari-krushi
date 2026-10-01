import type { AdminRole } from "@/generated/prisma/enums";

const ALL: readonly AdminRole[] = ["OWNER", "MANAGER", "PACKER"];
const OWNER_MANAGER: readonly AdminRole[] = ["OWNER", "MANAGER"];
const OWNER_ONLY: readonly AdminRole[] = ["OWNER"];

/** Which roles may perform each admin action. Enforced server-side. */
export const PERMISSIONS = {
  "dashboard:view": ALL,
  "orders:view": ALL,
  "orders:update-status": ALL,
  "orders:refund": OWNER_MANAGER,
  "products:manage": OWNER_MANAGER,
  "inventory:manage": OWNER_MANAGER,
  "enquiries:manage": OWNER_MANAGER,
  "customers:manage": OWNER_MANAGER,
  "reviews:manage": OWNER_MANAGER,
  "reports:view": OWNER_ONLY,
  "staff:manage": OWNER_ONLY,
  "settings:manage": OWNER_ONLY,
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly AdminRole[]).includes(role);
}

export const ADMIN_ROLES = ALL;
