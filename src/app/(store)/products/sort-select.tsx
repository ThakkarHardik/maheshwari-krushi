"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/input";
import { listingHref, SORTS, type ListingParams, type Sort } from "@/lib/catalog/listing";

export function SortSelect({ params }: { params: ListingParams }) {
  const t = useTranslations("products");
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground whitespace-nowrap">{t("sortLabel")}</span>
      <Select
        value={params.sort}
        onChange={(e) => router.push(listingHref({ ...params, sort: e.target.value as Sort, page: 1 }))}
        className="h-10 w-auto"
      >
        {SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {t(`sort.${sort}`)}
          </option>
        ))}
      </Select>
    </label>
  );
}
