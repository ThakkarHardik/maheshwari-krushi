"use client";

import { useActionState, useRef, useState } from "react";
import { CircleCheck, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { submitEnquiryAction, type EnquiryState } from "@/lib/enquiry/actions";
import { composeWhatsAppText, enquirySchema } from "@/lib/enquiry/schema";
import { useEditableErrors } from "@/lib/use-editable-errors";
import { useFormSubmit } from "@/lib/use-form-submit";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Props = {
  whatsapp: string;
  defaultMessage: string;
  productId?: string;
  productName?: string;
  onDone?: () => void;
};

function validationErrors(formData: FormData) {
  const result = enquirySchema.safeParse(Object.fromEntries(formData));
  if (result.success) return { data: result.data, errors: undefined };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
  }
  return { data: undefined, errors };
}

export function EnquiryForm({ whatsapp, defaultMessage, productId, productName, onDone }: Props) {
  const t = useTranslations("enquiry");
  const formRef = useRef<HTMLFormElement>(null);
  const [startedAt] = useState(() => Date.now());
  const [state, formAction, pending] = useActionState<EnquiryState, FormData>(submitEnquiryAction, {});
  const onSubmit = useFormSubmit(formAction);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>();
  const [sentVia, setSentVia] = useState<"whatsapp" | null>(null);
  const [submittedMobile, setSubmittedMobile] = useState("");

  const [errors, markEdited] = useEditableErrors(localErrors ?? state.errors);
  const fieldError = (name: string) =>
    errors?.[name] ? (
      <p id={`enq-${name}-error`} className="text-danger mt-1 text-sm">
        {t(`errors.${errors[name]}`)}
      </p>
    ) : null;

  // WhatsApp must open inside the click handler (or the browser blocks the pop-up),
  // so the enquiry is saved in the background while WhatsApp opens.
  function sendOnWhatsApp() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const { data, errors: found } = validationErrors(formData);
    if (!data) return setLocalErrors(found);
    setLocalErrors(undefined);
    formData.set("source", "WHATSAPP");
    window.open(
      buildWhatsAppLink(whatsapp, composeWhatsAppText(data.message, data.name, data.mobile)),
      "_blank",
      "noopener,noreferrer",
    );
    submitEnquiryAction({}, formData).catch(() => undefined);
    setSubmittedMobile(data.mobile);
    setSentVia("whatsapp");
  }

  if (state.ok || sentVia) {
    return (
      <div role="status" className="space-y-4 py-4 text-center">
        <CircleCheck className="text-brand-600 mx-auto size-12" aria-hidden />
        <p className="text-brand-800 text-xl font-bold">{t("successTitle")}</p>
        <p>{sentVia === "whatsapp" ? t("successWhatsapp") : t("success", { mobile: submittedMobile })}</p>
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            {t("close")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        const { data, errors: found } = validationErrors(new FormData(e.currentTarget));
        if (!data) {
          e.preventDefault();
          return setLocalErrors(found);
        }
        setLocalErrors(undefined);
        setSubmittedMobile(data.mobile);
        onSubmit(e);
      }}
      onChange={markEdited}
      noValidate
      className="space-y-4"
    >
      {productId && <input type="hidden" name="productId" value={productId} />}
      <input type="hidden" name="source" value="FORM" />
      <input type="hidden" name="startedAt" value={startedAt} />
      {/* Honeypot — hidden from people; bots tend to fill every field. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          {t("honeypot")}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {productName && (
        <p className="bg-brand-50 text-brand-800 rounded-md px-3 py-2 text-sm font-medium">
          {t("about", { product: productName })}
        </p>
      )}

      <div>
        <Label htmlFor="enq-name">{t("name")}</Label>
        <Input
          id="enq-name"
          name="name"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          maxLength={60}
          aria-invalid={Boolean(errors?.name)}
          aria-describedby={errors?.name ? "enq-name-error" : undefined}
          className={cn(errors?.name && "border-danger")}
        />
        {fieldError("name")}
      </div>
      <div>
        <Label htmlFor="enq-mobile">{t("mobile")}</Label>
        <Input
          id="enq-mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={t("mobilePlaceholder")}
          maxLength={16}
          aria-invalid={Boolean(errors?.mobile)}
          aria-describedby={errors?.mobile ? "enq-mobile-error" : undefined}
          className={cn(errors?.mobile && "border-danger")}
        />
        {fieldError("mobile")}
      </div>
      <div>
        <Label htmlFor="enq-message">{t("message")}</Label>
        <textarea
          id="enq-message"
          name="message"
          rows={3}
          maxLength={1000}
          defaultValue={defaultMessage}
          aria-invalid={Boolean(errors?.message)}
          aria-describedby={errors?.message ? "enq-message-error" : undefined}
          className={cn(
            "border-border focus:border-brand-600 focus:ring-brand-200 w-full rounded-md border bg-white px-3 py-2 text-base focus:ring-2 focus:outline-none",
            errors?.message && "border-danger",
          )}
        />
        {fieldError("message")}
      </div>

      {errors?._form && (
        <p role="alert" className="text-danger rounded-md bg-red-50 px-3 py-2 text-sm">
          {t(`errors.${errors._form}`)}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="submit" size="lg" disabled={pending}>
          <Send /> {pending ? t("sending") : t("send")}
        </Button>
        <Button type="button" size="lg" variant="accent" onClick={sendOnWhatsApp} disabled={pending}>
          <MessageCircle /> {t("sendWhatsapp")}
        </Button>
      </div>
    </form>
  );
}
