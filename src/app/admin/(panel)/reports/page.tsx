import Link from "next/link";
import { Download } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/session";
import { formatINR } from "@/lib/format";
import {
  gstSummary,
  istDateKey,
  parseRange,
  salesByCategory,
  salesByDay,
  salesByProduct,
  stockValuation,
  summarizeSales,
} from "@/lib/reports/compute";
import { loadReportOrders, loadStockBatches } from "@/lib/reports/data";

const rupees = (paise: number) => formatINR(paise / 100);

function presets(now = new Date()) {
  const today = istDateKey(now);
  const day = (offset: number) => istDateKey(new Date(now.getTime() + offset * 86_400_000));
  const [y, m] = today.split("-").map(Number);
  const lastMonthStart = new Date(Date.UTC(m === 1 ? y - 1 : y, m === 1 ? 11 : m - 2, 1));
  const lastMonthEnd = new Date(Date.UTC(y, m - 1, 0));
  return {
    today: { from: today, to: today },
    last7: { from: day(-6), to: today },
    thisMonth: { from: `${today.slice(0, 8)}01`, to: today },
    lastMonth: {
      from: lastMonthStart.toISOString().slice(0, 10),
      to: lastMonthEnd.toISOString().slice(0, 10),
    },
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin("reports:view");
  const params = await searchParams;
  const range = parseRange(params.from, params.to);
  const t = await getTranslations("admin.reports");
  const format = await getFormatter();

  const [{ placed, invoiced }, batches] = await Promise.all([loadReportOrders(range), loadStockBatches()]);
  const summary = summarizeSales(placed);
  const days = salesByDay(placed);
  const products = salesByProduct(placed);
  const categories = salesByCategory(placed);
  const gst = gstSummary(invoiced);
  const stock = stockValuation(batches);
  const qs = `from=${range.from}&to=${range.to}`;
  const exportLink = (type: string) => `/admin/reports/export?type=${type}&${qs}`;

  const cards = [
    {
      label: t("summary.revenue"),
      value: rupees(summary.revenue),
      hint: t("summary.shipping", { amount: rupees(summary.shipping) }),
    },
    {
      label: t("summary.orders"),
      value: String(summary.orderCount),
      hint: t("summary.cancelled", { count: summary.cancelledCount }),
    },
    { label: t("summary.items"), value: String(summary.itemsSold) },
    { label: t("summary.average"), value: rupees(summary.averageOrder) },
    { label: t("summary.codCollected"), value: rupees(summary.codCollected) },
    { label: t("summary.codPending"), value: rupees(summary.codPending) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="from">{t("from")}</Label>
          <Input id="from" name="from" type="date" defaultValue={range.from} className="h-10" />
        </div>
        <div>
          <Label htmlFor="to">{t("to")}</Label>
          <Input id="to" name="to" type="date" defaultValue={range.to} className="h-10" />
        </div>
        <Button type="submit" className="h-10">
          {t("show")}
        </Button>
        <div className="flex flex-wrap gap-2">
          {Object.entries(presets()).map(([key, p]) => (
            <Link
              key={key}
              href={`/admin/reports?from=${p.from}&to=${p.to}`}
              className="border-border hover:bg-brand-50 rounded-full border bg-white px-3 py-1.5 text-sm"
            >
              {t(`presets.${key}`)}
            </Link>
          ))}
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="space-y-1 py-4">
              <p className="text-muted-foreground text-sm">{c.label}</p>
              <p className="text-brand-800 text-2xl font-bold">{c.value}</p>
              {c.hint && <p className="text-muted-foreground text-xs">{c.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportCard title={t("byDay")} download={exportLink("daily")} downloadLabel={t("download")}>
        <Table
          head={[t("day"), t("orders"), t("revenue")]}
          align={["left", "right", "right"]}
          rows={days.map((d) => [
            format.dateTime(new Date(`${d.day}T00:00:00+05:30`), { dateStyle: "medium" }),
            d.orders,
            rupees(d.revenue),
          ])}
          empty={t("none")}
        />
      </ReportCard>

      <div className="grid gap-6">
        <ReportCard title={t("byProduct")} download={exportLink("products")} downloadLabel={t("download")}>
          <Table
            head={[t("product"), t("pack"), t("qty"), t("revenue")]}
            align={["left", "left", "right", "right"]}
            rows={products.map((p) => [p.product, p.pack, p.quantity, rupees(p.revenue)])}
            empty={t("none")}
          />
        </ReportCard>
        <ReportCard title={t("byCategory")}>
          <Table
            head={[t("category"), t("qty"), t("revenue")]}
            align={["left", "right", "right"]}
            rows={categories.map((c) => [c.category, c.quantity, rupees(c.revenue)])}
            empty={t("none")}
          />
        </ReportCard>
      </div>

      <ReportCard title={t("gst")} download={exportLink("gst")} downloadLabel={t("download")}>
        <p className="text-muted-foreground px-5 pt-3 text-sm">
          {t("gstHint")} {t("invoices", { count: gst.invoiceCount })}
          {gst.returnedCount > 0 && (
            <span className="text-danger"> {t("gstReturned", { count: gst.returnedCount })}</span>
          )}
        </p>
        <Table
          head={[t("hsn"), t("rate"), t("qty"), t("taxable"), t("cgst"), t("sgst"), t("igst"), t("total")]}
          align={["left", "right", "right", "right", "right", "right", "right", "right"]}
          rows={gst.lines.map((l) => [
            l.hsn,
            `${l.rate}%`,
            l.quantity,
            rupees(l.taxable),
            rupees(l.cgst),
            rupees(l.sgst),
            rupees(l.igst),
            rupees(l.total),
          ])}
          foot={
            gst.lines.length
              ? [
                  t("totalRow"),
                  "",
                  "",
                  rupees(gst.totals.taxable),
                  rupees(gst.totals.cgst),
                  rupees(gst.totals.sgst),
                  rupees(gst.totals.igst),
                  rupees(gst.totals.total),
                ]
              : undefined
          }
          empty={t("none")}
        />
        {gst.lines.length > 0 && (
          <p className="text-muted-foreground px-5 pb-4 text-sm">
            {t("shippingNoGst", { amount: rupees(gst.shipping) })}
          </p>
        )}
      </ReportCard>

      <ReportCard title={t("stock")} download={exportLink("stock")} downloadLabel={t("download")}>
        <p className="text-muted-foreground px-5 pt-3 text-sm">{t("stockHint")}</p>
        <Table
          head={[t("product"), t("pack"), t("qty"), t("atCost"), t("atPrice"), t("missingCost")]}
          align={["left", "left", "right", "right", "right", "right"]}
          rows={stock.lines.map((l) => [
            l.product,
            l.pack,
            l.quantity,
            rupees(l.atCost),
            rupees(l.atPrice),
            l.missingCost || "—",
          ])}
          foot={[
            t("totalRow"),
            "",
            stock.totals.quantity,
            rupees(stock.totals.atCost),
            rupees(stock.totals.atPrice),
            stock.totals.missingCost || "—",
          ]}
          empty={t("none")}
        />
      </ReportCard>
    </div>
  );
}

function ReportCard({
  title,
  download,
  downloadLabel,
  children,
}: {
  title: string;
  download?: string;
  downloadLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-x-auto">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {download && (
          <a
            href={download}
            className="text-brand-700 flex items-center gap-1 text-sm font-medium hover:underline"
          >
            <Download className="size-4" /> {downloadLabel}
          </a>
        )}
      </CardHeader>
      {children}
    </Card>
  );
}

function Table({
  head,
  rows,
  foot,
  align,
  empty,
}: {
  head: string[];
  rows: (string | number)[][];
  foot?: (string | number)[];
  align: ("left" | "right")[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-muted-foreground px-5 py-6 text-sm">{empty}</p>;
  const cls = (i: number) => (align[i] === "right" ? "text-right tabular-nums" : "text-left");
  return (
    <table className="w-full min-w-[560px] text-sm">
      <thead className="border-border text-brand-800 border-b">
        <tr>
          {head.map((h, i) => (
            <th key={h + i} className={`px-4 py-2 font-semibold ${cls(i)}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-border border-b last:border-0">
            {row.map((c, i) => (
              <td key={i} className={`px-4 py-2 ${cls(i)}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {foot && (
        <tfoot className="border-border bg-brand-50 border-t font-semibold">
          <tr>
            {foot.map((c, i) => (
              <td key={i} className={`px-4 py-2 ${cls(i)}`}>
                {c}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
