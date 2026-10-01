import type { Permission } from "@/lib/auth/roles";

/** Admin sidebar. Later phases add Products, Orders, Inventory, Enquiries… */
export const ADMIN_NAV = [
  { href: "/admin", key: "dashboard", permission: "dashboard:view", icon: "dashboard" },
  { href: "/admin/staff", key: "staff", permission: "staff:manage", icon: "staff" },
] as const satisfies ReadonlyArray<{ href: string; key: string; permission: Permission; icon: string }>;
