import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReviewStatus } from "@/generated/prisma/enums";
import { Stars } from "@/components/store/stars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { setReviewStatusAction } from "./actions";

const STATUSES: ReviewStatus[] = ["PENDING", "APPROVED", "HIDDEN"];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("reviews:manage");
  const { status: statusParam } = await searchParams;
  const status = STATUSES.find((s) => s === statusParam) ?? (statusParam === "all" ? undefined : "PENDING");
  const t = await getTranslations("admin.reviews");
  const format = await getFormatter();

  const [counts, reviews] = await Promise.all([
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
    db.review.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { product: { select: { id: true, nameHi: true } } },
    }),
  ]);
  const countOf = (s: ReviewStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {[...STATUSES, "all" as const].map((s) => {
          const active = s === "all" ? status === undefined : status === s;
          return (
            <Link
              key={s}
              href={`/admin/reviews?status=${s}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium",
                active
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-border hover:bg-brand-50 bg-white",
              )}
            >
              {s === "all" ? t("all") : t(`statuses.${s}`)}
              {s !== "all" && <span className="opacity-75"> ({countOf(s)})</span>}
            </Link>
          );
        })}
      </nav>

      {reviews.length === 0 ? (
        <Card>
          <p className="text-muted-foreground px-5 py-10 text-center">{t("empty")}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} label={`${r.rating}/5`} />
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {format.dateTime(r.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-sm">
                      {t("product")}:{" "}
                      <Link
                        href={`/admin/products/${r.product.id}`}
                        className="text-brand-700 hover:underline"
                      >
                        {r.product.nameHi}
                      </Link>
                    </p>
                    <p className="whitespace-pre-line">
                      {r.comment ?? <span className="text-muted-foreground">{t("noComment")}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {r.status !== "APPROVED" && (
                      <form action={setReviewStatusAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <Button type="submit" size="sm">
                          {t("approve")}
                        </Button>
                      </form>
                    )}
                    {r.status !== "HIDDEN" && (
                      <form action={setReviewStatusAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="HIDDEN" />
                        <Button type="submit" size="sm" variant="outline">
                          {t("hide")}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
