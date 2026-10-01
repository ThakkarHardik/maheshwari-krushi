import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { StatusBadge } from "../status-badge";
import { EnquiryUpdateForm } from "./enquiry-update-form";

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("enquiries:manage");
  const { id } = await params;
  const t = await getTranslations("admin.enquiries");
  const format = await getFormatter();

  const enquiry = await db.enquiry.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, nameHi: true, slug: true } },
      customer: { select: { id: true } },
    },
  });
  if (!enquiry) notFound();

  const previous = await db.enquiry.count({
    where: { mobile: enquiry.mobile, id: { not: enquiry.id }, createdAt: { lt: enquiry.createdAt } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/enquiries" className="text-brand-700 text-sm hover:underline">
        {t("back")}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-brand-800 text-2xl font-bold">{t("detailTitle", { name: enquiry.name })}</h1>
        <StatusBadge status={enquiry.status} label={t(`statuses.${enquiry.status}`)} />
      </div>

      <Card>
        <CardContent className="space-y-4 py-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("customer")}</dt>
              <dd className="font-medium">
                {enquiry.name} · +91 {enquiry.mobile}
                {enquiry.customer && (
                  <span className="bg-brand-50 text-brand-700 ml-2 rounded px-2 py-0.5 text-xs">
                    {t("existingCustomer")}
                  </span>
                )}
              </dd>
              {previous > 0 && (
                <dd className="text-muted-foreground text-xs">{t("previous", { count: previous })}</dd>
              )}
            </div>
            <div>
              <dt className="text-muted-foreground">{t("product")}</dt>
              <dd className="font-medium">
                {enquiry.product ? (
                  <Link href={`/admin/products/${enquiry.product.id}`} className="hover:underline">
                    {enquiry.product.nameHi}
                  </Link>
                ) : (
                  t("general")
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("date")}</dt>
              <dd>{format.dateTime(enquiry.createdAt, { dateStyle: "long", timeStyle: "short" })}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("source")}</dt>
              <dd>{t(`sources.${enquiry.source}`)}</dd>
            </div>
          </dl>

          <div>
            <p className="text-muted-foreground text-sm">{t("message")}</p>
            <p className="bg-muted mt-1 rounded-md px-4 py-3 whitespace-pre-line">{enquiry.message}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:+91${enquiry.mobile}`}
              className="border-border hover:bg-brand-50 flex items-center gap-2 rounded-md border px-4 py-2 font-medium"
            >
              <Phone className="size-4" /> {t("call")}
            </a>
            <a
              href={buildWhatsAppLink(`91${enquiry.mobile}`, t("replyMessage", { name: enquiry.name }))}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp flex items-center gap-2 rounded-md px-4 py-2 font-medium text-white"
            >
              <MessageCircle className="size-4" /> {t("whatsapp")}
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <EnquiryUpdateForm id={enquiry.id} status={enquiry.status} adminNote={enquiry.adminNote} />
        </CardContent>
      </Card>
    </div>
  );
}
