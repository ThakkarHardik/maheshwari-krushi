import type { Permission } from "@/lib/auth/roles";

/** Admin sidebar. Later phases add Products, Orders, Inventory, Enquiries… */
export const ADMIN_NAV = [
  { href: "/admin", key: "dashboard", permission: "dashboard:view", icon: "dashboard" },
  { href: "/admin/products", key: "products", permission: "products:manage", icon: "products" },
  { href: "/admin/categories", key: "categories", permission: "products:manage", icon: "categories" },
  { href: "/admin/enquiries", key: "enquiries", permission: "enquiries:manage", icon: "enquiries" },
  { href: "/admin/staff", key: "staff", permission: "staff:manage", icon: "staff" },
] as const satisfies ReadonlyArray<{ href: string; key: string; permission: Permission; icon: string }>;
