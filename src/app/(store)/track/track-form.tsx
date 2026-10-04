"use client";

import { useActionState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatINR } from "@/lib/format";
import { useFormSubmit } from "@/lib/use-form-submit";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { trackOrderAction, type TrackState } from "./actions";

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export function TrackForm({
  whatsapp,
  defaultOrderNumber,
}: {
  whatsapp: string;
  defaultOrderNumber?: string;
}) {
  const t = useTranslations("track");
  const tSuccess = useTranslations("orderSuccess");
  const format = useFormatter();
  const [state, formAction, pending] = useActionState<TrackState, FormData>(trackOrderAction, {});
  const onSubmit = useFormSubmit(formAction);
  const order = state.order;
  const currentStep = order ? STEPS.indexOf(order.status as (typeof STEPS)[number]) : -1;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="track-order">{t("orderNumber")}</Label>
          <Input
            id="track-order"
            name="orderNumber"
            defaultValue={defaultOrderNumber}
            placeholder={t("orderPlaceholder")}
            autoCapitalize="characters"
            maxLength={20}
            required
          />
        </div>
        <div>
          <Label htmlFor="track-mobile">{t("mobile")}</Label>
          <Input id="track-mobile" name="mobile" type="tel" inputMode="numeric" maxLength={16} required />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("checking") : t("submit")}
        </Button>
      </form>

      {state.error && (
        <p role="alert" className="text-danger rounded-md bg-red-50 px-4 py-3 text-center">
          {t(state.error)}
        </p>
      )}

      {order && (
        <section
          aria-live="polite"
          className="border-border rounded-card animate-scale-in space-y-5 border bg-white p-5 text-center"
        >
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-brand-800 text-xl font-bold">#{order.orderNumber}</h2>
            <p className="text-muted-foreground text-sm">
              {t("placed")}: {format.dateTime(new Date(order.placedAt), { dateStyle: "medium" })}
            </p>
          </div>

          {order.status === "CANCELLED" || order.status === "RETURNED" ? (
            <p className="text-danger font-semibold">
              {t(order.status === "CANCELLED" ? "cancelled" : "returned")}
            </p>
          ) : (
            <ol className="grid grid-cols-5 gap-1">
              {STEPS.map((step, i) => {
                const done = i <= currentStep;
                const at = order.reached[step];
                return (
                  <li key={step} className="flex flex-col items-center text-center">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full border-2",
                        done
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-border text-muted-foreground bg-white",
                      )}
                    >
                      {done ? <Check className="size-5" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-xs font-medium",
                        done ? "text-brand-800" : "text-muted-foreground",
                      )}
                    >
                      {t(`steps.${step}`)}
                    </span>
                    {at && (
                      <span className="text-muted-foreground text-[10px]">
                        {format.dateTime(new Date(at), { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {(order.courierName || order.trackingNumber) && (
            <p className="text-sm">
              {order.courierName && (
                <>
                  <strong>{t("courier")}:</strong> {order.courierName}{" "}
                </>
              )}
              {order.trackingNumber && (
                <>
                  <strong>{t("tracking")}:</strong> {order.trackingNumber}
                </>
              )}
            </p>
          )}

          <div>
            <h3 className="mb-1 text-sm font-semibold">{t("items")}</h3>
            <ul className="text-sm">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} ({item.label}) × {item.quantity}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-semibold">
              {t("total")}: {formatINR(order.grandTotal)}
            </p>
          </div>

          <a
            href={buildWhatsAppLink(whatsapp, tSuccess("whatsappMessage", { number: order.orderNumber }))}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 inline-flex items-center gap-1 text-sm font-semibold underline"
          >
            <MessageCircle className="size-4" /> {t("help")}
          </a>
        </section>
      )}
    </div>
  );
}
