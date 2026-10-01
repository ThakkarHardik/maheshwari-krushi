"use client";

import { useActionState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/generated/prisma/enums";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { useFormSubmit } from "@/lib/use-form-submit";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  markCodCollectedAction,
  markNotificationSentAction,
  saveOrderNoteAction,
  transitionOrderAction,
  type OrderActionState,
} from "../actions";

function Feedback({ state }: { state: OrderActionState }) {
  const t = useTranslations("admin.orders");
  if (state.ok) {
    return (
      <p role="status" className="text-brand-700 text-sm font-medium">
        {t("updated")}
      </p>
    );
  }
  if (!state.error) return null;
  return (
    <p role="alert" className="text-danger text-sm">
      {t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : t("errors.invalid")}
    </p>
  );
}

/** One form per allowed next status, with the fields that step needs. */
function StatusStep({ orderId, to, isCod }: { orderId: string; to: OrderStatus; isCod: boolean }) {
  const t = useTranslations("admin.orders");
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(transitionOrderAction, {});
  const submit = useFormSubmit(formAction);
  const destructive = to === "CANCELLED" || to === "RETURNED";

  return (
    <form
      onSubmit={(e) => {
        if (destructive && !window.confirm(t(to === "CANCELLED" ? "confirmCancel" : "confirmReturn"))) {
          e.preventDefault();
          return;
        }
        submit(e);
      }}
      className={destructive ? "border-border space-y-3 rounded-md border border-dashed p-3" : "space-y-3"}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="to" value={to} />
      {to === "SHIPPED" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField name="courierName" label={t("courier")} errors={undefined} maxLength={80} />
          <TextField name="trackingNumber" label={t("tracking")} errors={undefined} maxLength={60} />
        </div>
      )}
      {to === "DELIVERED" && isCod && (
        <CheckboxField name="codCollected" label={t("codCollected")} defaultChecked />
      )}
      {to === "RETURNED" && <CheckboxField name="restock" label={t("restock")} />}
      {(destructive || to === "CONFIRMED") && (
        <TextField name="note" label={t("note")} errors={undefined} maxLength={300} />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant={destructive ? "outline" : "primary"}
          className={destructive ? "border-danger text-danger hover:bg-red-50" : undefined}
          disabled={pending}
        >
          {t(`actions.${to}`)}
        </Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function StatusActions({
  orderId,
  next,
  isCod,
}: {
  orderId: string;
  next: OrderStatus[];
  isCod: boolean;
}) {
  const t = useTranslations("admin.orders");
  if (next.length === 0) return <p className="text-muted-foreground text-sm">{t("noActions")}</p>;
  return (
    <div className="space-y-4">
      {next.map((to) => (
        <StatusStep key={to} orderId={orderId} to={to} isCod={isCod} />
      ))}
    </div>
  );
}

export function CodCollectedButton({ orderId }: { orderId: string }) {
  const t = useTranslations("admin.orders");
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(markCodCollectedAction, {});
  const submit = useFormSubmit(formAction);
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {t("markCod")}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function AdminNoteForm({ orderId, note }: { orderId: string; note: string | null }) {
  const t = useTranslations("admin.orders");
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(saveOrderNoteAction, {});
  const submit = useFormSubmit(formAction);
  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <TextAreaField
        name="adminNote"
        label={t("adminNote")}
        errors={undefined}
        defaultValue={note ?? ""}
        rows={3}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {t("saveNote")}
        </Button>
        {state.ok && (
          <p role="status" className="text-brand-700 text-sm">
            {t("noteSaved")}
          </p>
        )}
      </div>
    </form>
  );
}

/** Opens WhatsApp with the queued message, then marks it as sent by hand. */
export function SendOnWhatsApp({ id, mobile, body }: { id: string; mobile: string; body: string }) {
  const t = useTranslations("admin.orders");
  const [pending, startTransition] = useTransition();
  return (
    <a
      href={buildWhatsAppLink(`91${mobile}`, body)}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={pending}
      onClick={() => startTransition(() => markNotificationSentAction(id))}
      className="bg-whatsapp inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-white"
    >
      <MessageCircle className="size-4" /> {t("sendWhatsapp")}
    </a>
  );
}
