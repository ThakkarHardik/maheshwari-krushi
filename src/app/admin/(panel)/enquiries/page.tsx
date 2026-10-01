import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { EnquiryStatus } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { setEnquiryStatusAction } from "./actions";
import { StatusBadge } from "./status-badge";

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("enquiries:manage");
  const { status: statusParam } = await searchParams;
  const status = STATUSES.find((s) => s === statusParam);
  const t = await getTranslations("admin.enquiries");
  const format = await getFormatter();

  const [counts, enquiries] = await Promise.all([
    db.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    db.enquiry.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { product: { select: { id: true, nameHi: true } } },
    }),
  ]);
  const countOf = (s: EnquiryStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);

  const tabs = [
    { key: undefined, label: t("all"), count: total },
    ...STATUSES.map((s) => ({ key: s, label: t(`statuses.${s}`), count: countOf(s) })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label={t("status")}>
        {tabs.map((tab) => (
          <Link
            key={tab.key ?? "all"}
            href={tab.key ? `/admin/enquiries?status=${tab.key}` : "/admin/enquiries"}
            aria-current={tab.key === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              tab.key === status
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-border hover:bg-brand-50 bg-white",
            )}
          >
            {tab.label} <span className="opacity-75">({tab.count})</span>
          </Link>
        ))}
      </nav>

      {enquiries.length === 0 ? (
        <Card>
          <p className="text-muted-foreground px-5 py-10 text-center">{t("empty")}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {enquiries.map((e) => (
            <li key={e.id}>
              <Card className={cn("p-4", e.status === "NEW" && "border-accent-400")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/enquiries/${e.id}`}
                        className="text-brand-800 font-semibold hover:underline"
                      >
                        {e.name}
                      </Link>
                      <span className="text-muted-foreground text-sm">+91 {e.mobile}</span>
                      <StatusBadge status={e.status} label={t(`statuses.${e.status}`)} />
                      <span className="text-muted-foreground text-xs">{t(`sources.${e.source}`)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {format.dateTime(e.createdAt, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                      {e.product ? (
                        <Link href={`/admin/products/${e.product.id}`} className="hover:underline">
                          {e.product.nameHi}
                        </Link>
                      ) : (
                        t("general")
                      )}
                    </p>
                    <p className="line-clamp-2 text-sm whitespace-pre-line">{e.message}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <a
                      href={`tel:+91${e.mobile}`}
                      className="border-border hover:bg-brand-50 flex items-center gap-1 rounded-md border px-3 py-2"
                    >
                      <Phone className="size-4" /> {t("call")}
                    </a>
                    <a
                      href={buildWhatsAppLink(`91${e.mobile}`, t("replyMessage", { name: e.name }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-whatsapp flex items-center gap-1 rounded-md px-3 py-2 font-medium text-white"
                    >
                      <MessageCircle className="size-4" /> {t("whatsapp")}
                    </a>
                    {e.status === "NEW" && (
                      <form action={setEnquiryStatusAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="status" value="CONTACTED" />
                        <button
                          type="submit"
                          className="text-brand-700 border-brand-700 hover:bg-brand-50 rounded-md border px-3 py-2"
                        >
                          ✓ {t("statuses.CONTACTED")}
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/admin/enquiries/${e.id}`}
                      className="text-brand-700 px-2 py-2 hover:underline"
                    >
                      {t("open")} →
                    </Link>
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
