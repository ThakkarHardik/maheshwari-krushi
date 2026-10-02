import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/roles";
import { writeAudit } from "@/lib/audit";
import { gstSummary, parseRange, salesByDay, salesByProduct, stockValuation } from "@/lib/reports/compute";
import { csvAmount, toCsv } from "@/lib/reports/csv";
import { loadReportOrders, loadStockBatches } from "@/lib/reports/data";

const TYPES = ["daily", "products", "gst", "stock"] as const;
type ExportType = (typeof TYPES)[number];

/** CSV downloads for the Reports page (Owner only). */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin || !hasPermission(admin.role, "reports:view")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const params = request.nextUrl.searchParams;
  const type = TYPES.find((t) => t === params.get("type")) as ExportType | undefined;
  if (!type) return new NextResponse("Unknown report", { status: 400 });
  const range = parseRange(params.get("from") ?? undefined, params.get("to") ?? undefined);

  let csv: string;
  if (type === "stock") {
    const { lines } = stockValuation(await loadStockBatches());
    csv = toCsv(
      [
        "SKU",
        "Product",
        "Pack",
        "Quantity",
        "Value at cost",
        "Value at selling price",
        "Qty without cost price",
      ],
      lines.map((l) => [
        l.sku,
        l.product,
        l.pack,
        l.quantity,
        csvAmount(l.atCost),
        csvAmount(l.atPrice),
        l.missingCost,
      ]),
    );
  } else {
    const { placed, invoiced } = await loadReportOrders(range);
    if (type === "daily") {
      csv = toCsv(
        ["Date", "Orders", "Sales"],
        salesByDay(placed).map((d) => [d.day, d.orders, csvAmount(d.revenue)]),
      );
    } else if (type === "products") {
      csv = toCsv(
        ["SKU", "Product", "Pack", "Category", "Quantity", "Sales"],
        salesByProduct(placed).map((p) => [
          p.sku,
          p.product,
          p.pack,
          p.category,
          p.quantity,
          csvAmount(p.revenue),
        ]),
      );
    } else {
      const gst = gstSummary(invoiced);
      csv = toCsv(
        ["HSN", "GST rate %", "Quantity", "Taxable value", "CGST", "SGST", "IGST", "Total"],
        [
          ...gst.lines.map((l) => [
            l.hsn,
            l.rate,
            l.quantity,
            csvAmount(l.taxable),
            csvAmount(l.cgst),
            csvAmount(l.sgst),
            csvAmount(l.igst),
            csvAmount(l.total),
          ]),
          [
            "TOTAL",
            "",
            "",
            csvAmount(gst.totals.taxable),
            csvAmount(gst.totals.cgst),
            csvAmount(gst.totals.sgst),
            csvAmount(gst.totals.igst),
            csvAmount(gst.totals.total),
          ],
          ["Delivery charges (outside GST)", "", "", "", "", "", "", csvAmount(gst.shipping)],
        ],
      );
    }
  }

  await writeAudit({
    adminUserId: admin.id,
    action: "report.export",
    entityType: "Report",
    entityId: type,
    meta: { from: range.from, to: range.to },
  });
  const filename = type === "stock" ? `stock-${range.to}.csv` : `${type}-${range.from}-to-${range.to}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
