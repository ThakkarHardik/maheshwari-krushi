"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav aria-label={t("menu")} className="hidden md:block">
          <ul className="flex items-center gap-6 text-[15px] font-medium">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "border-b-2 py-1 transition-colors",
                    isActive(pathname, link.href)
                      ? "border-brand-700 text-brand-800"
                      : "text-foreground hover:text-brand-700 border-transparent",
                  )}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher className="mr-1 hidden sm:inline-flex" />
          <Link
            href="/products"
            aria-label={t("search")}
            className="text-brand-800 hover:bg-brand-50 flex size-11 items-center justify-center rounded-md"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `${t("cart")} (${cartCount})` : t("cart")}
            className="text-brand-800 hover:bg-brand-50 relative flex size-11 items-center justify-center rounded-md"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="bg-accent-400 text-brand-900 absolute top-1 right-0.5 flex min-w-5 items-center justify-center rounded-full px-1 text-xs leading-5 font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="text-brand-800 hover:bg-brand-50 flex size-11 items-center justify-center rounded-md md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t("menu")} className="border-border border-t md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-3 text-base font-medium",
                    isActive(pathname, link.href) ? "bg-brand-50 text-brand-800" : "hover:bg-brand-50",
                  )}
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
            <li className="px-3 py-3">
              <LanguageSwitcher />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
