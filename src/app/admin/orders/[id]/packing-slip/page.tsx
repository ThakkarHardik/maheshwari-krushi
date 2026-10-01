import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { storeConfig } from "@/config/store";
import { formatINR } from "@/lib/format";
import { loadPrintableOrder } from "../print-data";
import { PrintToolbar } from "../print-toolbar";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const order = await loadPrintableOrder(id);
  return { title: `Packing slip ${order.orderNumber}` };
}

export default async function PackingSlipPage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await loadPrintableOrder(id);
  const t = await getTranslations("invoice");
  const format = await getFormatter();
  const codDue = order.paymentMethod === "COD" && order.paymentStatus !== "COD_COLLECTED";

  return (
    <>
      <PrintToolbar backHref={`/admin/orders/${order.id}`} backLabel={t("back")} printLabel={t("print")} />
      <article className="mx-auto max-w-[210mm] bg-white p-8 text-[13px] text-black shadow print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <h1 className="text-xl font-bold">{t("packingSlip")}</h1>
            <p className="text-2xl font-bold">#{order.orderNumber}</p>
            <p>{format.dateTime(order.placedAt, { dateStyle: "medium" })}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{storeConfig.nameHi}</p>
            <p>{storeConfig.addressHi}</p>
            <p>+91 {storeConfig.phone}</p>
          </div>
        </header>

        <section className="my-4 rounded border-2 border-black p-4">
          <p className="text-[11px] font-semibold uppercase">{t("billTo")}</p>
          <p className="text-lg font-bold">{order.shipName}</p>
          <p className="text-base">{order.shipLine1}</p>
          <p className="text-base">
            {order.shipCity}, {order.shipState} – <strong>{order.shipPincode}</strong>
          </p>
          <p className="text-base font-semibold">+91 {order.shipMobile}</p>
          {order.customerNote && <p className="mt-2 italic">“{order.customerNote}”</p>}
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1">{t("sno")}</th>
              <th className="border border-black px-2 py-1 text-left">{t("description")}</th>
              <th className="border border-black px-2 py-1">{t("batch")}</th>
              <th className="border border-black px-2 py-1">{t("qty")}</th>
              <th className="border border-black px-2 py-1">{t("checked")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id}>
                <td className="border border-black px-2 py-2 text-center">{i + 1}</td>
                <td className="border border-black px-2 py-2">
                  <span className="font-semibold">{item.productNameHi}</span> — {item.variantLabel}
                  <div className="font-mono text-[11px]">{item.sku}</div>
                </td>
                <td className="border border-black px-2 py-2 font-mono text-[12px]">
                  {item.allocations.map((a) => (
                    <div key={a.batchId}>
                      {a.batch.batchNo} × {a.quantity}
                    </div>
                  ))}
                </td>
                <td className="border border-black px-2 py-2 text-center text-lg font-bold">
                  {item.quantity}
                </td>
                <td className="border border-black px-2 py-2 text-center text-lg">☐</td>
              </tr>
            ))}
          </tbody>
        </table>

        {codDue && (
          <p className="mt-4 border-2 border-black px-4 py-3 text-center text-lg font-bold">
            {t("codAmount")}: {formatINR(order.grandTotal)}
          </p>
        )}

        <p className="mt-10 w-64 border-t border-black pt-1">{t("packedBy")}</p>
      </article>
    </>
  );
}
