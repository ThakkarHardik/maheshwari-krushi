import type { Permission } from "@/lib/auth/roles";

/** Admin sidebar. Later phases add Products, Orders, Inventory, Enquiries… */
export const ADMIN_NAV = [
  { href: "/admin", key: "dashboard", permission: "dashboard:view", icon: "dashboard" },
  { href: "/admin/orders", key: "orders", permission: "orders:view", icon: "orders" },
  { href: "/admin/products", key: "products", permission: "products:manage", icon: "products" },
  { href: "/admin/categories", key: "categories", permission: "products:manage", icon: "categories" },
  { href: "/admin/inventory", key: "inventory", permission: "inventory:manage", icon: "inventory" },
  { href: "/admin/enquiries", key: "enquiries", permission: "enquiries:manage", icon: "enquiries" },
  { href: "/admin/reviews", key: "reviews", permission: "reviews:manage", icon: "reviews" },
  { href: "/admin/reports", key: "reports", permission: "reports:view", icon: "reports" },
  { href: "/admin/staff", key: "staff", permission: "staff:manage", icon: "staff" },
  { href: "/admin/settings", key: "settings", permission: "settings:manage", icon: "settings" },
] as const satisfies ReadonlyArray<{ href: string; key: string; permission: Permission; icon: string }>;
