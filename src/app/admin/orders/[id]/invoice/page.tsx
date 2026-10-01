import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";
import { formatINR } from "@/lib/format";
import { amountInWords } from "@/lib/orders/invoice";
import { toPaise } from "@/lib/pricing";
import { loadPrintableOrder } from "../print-data";
import { PrintToolbar } from "../print-toolbar";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const order = await loadPrintableOrder(id);
  return { title: order.invoiceNumber ?? order.orderNumber };
}

export default async function InvoicePage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await loadPrintableOrder(id);
  const t = await getTranslations("invoice");
  const format = await getFormatter();
  const date = (d: Date) => format.dateTime(d, { day: "2-digit", month: "2-digit", year: "numeric" });
  const intra = order.igstTotal.isZero();
  const isInvoice = Boolean(order.invoiceNumber);
  const s = storeConfig;

  return (
    <>
      <PrintToolbar backHref={`/admin/orders/${order.id}`} backLabel={t("back")} printLabel={t("print")} />
      <article className="mx-auto max-w-[210mm] bg-white p-8 text-[12px] leading-snug text-black shadow print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
          <div>
            <h1 className="text-lg font-bold">{s.name}</h1>
            <p className="text-base font-semibold">{s.nameHi}</p>
            <p>
              {s.address.line1}, {s.address.city}, Dist. {s.address.district}, {s.address.state} –{" "}
              {s.address.pincode}
            </p>
            <p>
              {t("phone")}: +91 {s.phone} · {s.email}
            </p>
            <p>
              <strong>{t("gstin")}:</strong> {s.gstin} · <strong>{t("licence")}:</strong> {s.licenceNo}
            </p>
          </div>
          <div className="text-right">
            <p className="border border-black px-3 py-1 text-base font-bold uppercase">
              {isInvoice ? t("taxInvoice") : t("orderSummary")}
            </p>
            {!isInvoice && <p className="mt-1 max-w-48 text-[11px]">{t("notInvoiceYet")}</p>}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-black py-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {isInvoice && (
              <>
                <dt className="font-semibold">{t("invoiceNo")}</dt>
                <dd className="font-bold">{order.invoiceNumber}</dd>
                <dt className="font-semibold">{t("invoiceDate")}</dt>
                <dd>{order.invoiceDate && date(order.invoiceDate)}</dd>
              </>
            )}
            <dt className="font-semibold">{t("orderNo")}</dt>
            <dd>#{order.orderNumber}</dd>
            <dt className="font-semibold">{t("orderDate")}</dt>
            <dd>{date(order.placedAt)}</dd>
            <dt className="font-semibold">{t("placeOfSupply")}</dt>
            <dd>
              {order.shipState}
              {intra ? ` (${s.stateCode})` : ""}
            </dd>
            <dt className="font-semibold">{t("payment")}</dt>
            <dd>{order.paymentMethod === "COD" ? t("cod") : order.paymentMethod}</dd>
          </dl>
          <div>
            <p className="font-semibold">{t("billTo")}</p>
            <p className="font-bold">{order.shipName}</p>
            <p>{order.shipLine1}</p>
            <p>
              {order.shipCity}, {order.shipState} – {order.shipPincode}
            </p>
            <p>
              {t("phone")}: +91 {order.shipMobile}
            </p>
          </div>
        </section>

        <table className="mt-3 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <Th>{t("sno")}</Th>
              <Th className="text-left">{t("description")}</Th>
              <Th>{t("hsn")}</Th>
              <Th>{t("batch")}</Th>
              <Th>{t("qty")}</Th>
              <Th>{t("rate")}</Th>
              <Th>{t("taxable")}</Th>
              {intra ? (
                <>
                  <Th>{t("cgst")}</Th>
                  <Th>{t("sgst")}</Th>
                </>
              ) : (
                <Th>{t("igst")}</Th>
              )}
              <Th>{t("total")}</Th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const rate = item.gstRate.toNumber();
              return (
                <tr key={item.id}>
                  <Td className="text-center">{i + 1}</Td>
                  <Td>
                    <span className="font-semibold">{item.productNameHi}</span> — {item.variantLabel}
                  </Td>
                  <Td className="text-center">{item.hsnCode}</Td>
                  <Td className="font-mono text-[10px]">
                    {item.allocations.map((a) => (
                      <div key={a.batchId}>
                        {a.batch.batchNo}
                        {a.batch.expiryDate
                          ? ` / ${format.dateTime(a.batch.expiryDate, { month: "2-digit", year: "numeric" })}`
                          : ""}
                      </div>
                    ))}
                  </Td>
                  <Td className="text-right">{item.quantity}</Td>
                  <Td className="text-right">{formatINR(item.unitPrice)}</Td>
                  <Td className="text-right">{formatINR(item.taxableValue)}</Td>
                  {intra ? (
                    <>
                      <Td className="text-right">
                        {formatINR(item.cgst)}
                        <br />
                        <span className="text-[9px]">@{rate / 2}%</span>
                      </Td>
                      <Td className="text-right">
                        {formatINR(item.sgst)}
                        <br />
                        <span className="text-[9px]">@{rate / 2}%</span>
                      </Td>
                    </>
                  ) : (
                    <Td className="text-right">
                      {formatINR(item.igst)}
                      <br />
                      <span className="text-[9px]">@{rate}%</span>
                    </Td>
                  )}
                  <Td className="text-right font-semibold">{formatINR(item.lineTotal)}</Td>
                </tr>
              );
            })}
            <tr>
              <Td colSpan={intra ? 9 : 8} className="text-right">
                {t("shipping")}
              </Td>
              <Td className="text-right">{formatINR(order.shippingCharge)}</Td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <Td colSpan={6} className="text-right">
                {t("total")}
              </Td>
              <Td className="text-right">{formatINR(order.taxableTotal)}</Td>
              {intra ? (
                <>
                  <Td className="text-right">{formatINR(order.cgstTotal)}</Td>
                  <Td className="text-right">{formatINR(order.sgstTotal)}</Td>
                </>
              ) : (
                <Td className="text-right">{formatINR(order.igstTotal)}</Td>
              )}
              <Td className="text-right text-[13px]">{formatINR(order.grandTotal)}</Td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-3">
          <strong>{t("grandTotal")}:</strong> {formatINR(order.grandTotal)} · <strong>{t("inWords")}:</strong>{" "}
          {amountInWords(toPaise(order.grandTotal))}
        </p>

        <footer className="mt-8 flex items-end justify-between gap-6">
          <p className="max-w-[60%] text-[10px]">
            {t("declaration")}
            <br />
            {t("computerGenerated")}
          </p>
          <div className="text-center">
            <p className="font-semibold">{t("forSeller", { name: s.name })}</p>
            <div className="h-12" />
            <p className="border-t border-black px-6 pt-1">{t("signatory")}</p>
          </div>
        </footer>
      </article>
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`border border-black px-1.5 py-1 text-center font-semibold ${className}`}>{children}</th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border border-black px-1.5 py-1 align-top ${className}`}>
      {children}
    </td>
  );
}
