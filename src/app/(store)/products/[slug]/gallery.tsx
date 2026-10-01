"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ProductImage } from "@/components/store/product-image";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: { id: string; url: string }[]; name: string }) {
  const t = useTranslations("product");
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <ProductImage
        src={current?.url}
        alt={current ? t("imageAlt", { name, n: active + 1 }) : name}
        sizes="(min-width: 768px) 480px, 100vw"
        priority
        className="border-border rounded-card border"
        placeholderLabel={t("noImage")}
      />
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("showImage", { n: i + 1 })}
                aria-current={i === active}
                className={cn(
                  "bg-brand-50 relative block size-16 overflow-hidden rounded-md border-2 sm:size-20",
                  i === active ? "border-brand-700" : "hover:border-brand-200 border-transparent",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
