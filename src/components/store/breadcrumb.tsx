import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const t = await getTranslations("products");
  return (
    <nav aria-label={t("breadcrumb")} className="text-muted-foreground text-sm">
      <ol className="flex flex-wrap items-center justify-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
