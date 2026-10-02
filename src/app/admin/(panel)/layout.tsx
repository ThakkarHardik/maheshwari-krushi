import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/store/logo";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import { hasPermission } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getInventoryOverview, summarizeInventory } from "@/lib/inventory/overview";
import { logoutAction } from "../login/actions";
import { ADMIN_NAV } from "./nav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const ICONS = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  products: Package,
  categories: Tags,
  inventory: Boxes,
  enquiries: Inbox,
  reviews: Star,
  reports: BarChart3,
  staff: Users,
  settings: Settings,
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const t = await getTranslations("admin");
  const items = ADMIN_NAV.filter((item) => hasPermission(admin.role, item.permission));
  const canSeeStock = hasPermission(admin.role, "inventory:manage");
  const stock = canSeeStock ? summarizeInventory(await getInventoryOverview()) : null;
  const badges: Partial<Record<(typeof ADMIN_NAV)[number]["key"], number>> = {
    enquiries: hasPermission(admin.role, "enquiries:manage")
      ? await db.enquiry.count({ where: { status: "NEW" } })
      : 0,
    inventory: stock ? stock.low + stock.out : 0,
    orders: await db.order.count({ where: { status: "PENDING" } }),
    reviews: hasPermission(admin.role, "reviews:manage")
      ? await db.review.count({ where: { status: "PENDING" } })
      : 0,
  };

  return (
    <div className="bg-muted min-h-dvh md:flex">
      <aside className="border-border border-b bg-white md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
        </div>
        <nav aria-label={t("panelTitle")} className="overflow-x-auto px-2 pb-2 md:pb-0">
          <ul className="flex gap-1 md:flex-col">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:bg-brand-50 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap"
                  >
                    <Icon className="text-brand-600 size-4" aria-hidden />
                    {t(`nav.${item.key}`)}
                    {(badges[item.key] ?? 0) > 0 && (
                      <span className="bg-accent-400 text-brand-900 ml-auto rounded-full px-2 text-xs font-bold">
                        {badges[item.key]}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border flex flex-wrap items-center justify-end gap-3 border-b bg-white px-4 py-3">
          <span className="text-muted-foreground mr-auto text-sm">
            {admin.name} · {t(`roles.${admin.role}`)}
          </span>
          <LanguageSwitcher />
          <Link href="/" className="text-brand-700 flex items-center gap-1 text-sm hover:underline">
            <ExternalLink className="size-4" aria-hidden /> {t("nav.viewStore")}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-danger flex items-center gap-1 text-sm hover:underline">
              <LogOut className="size-4" aria-hidden /> {t("nav.logout")}
            </button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
