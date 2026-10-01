"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { checkPincodeAction, placeOrderAction, type CheckoutState } from "@/lib/checkout/actions";
import { checkoutSchema } from "@/lib/checkout/schema";
import type { DeliveryQuote } from "@/lib/delivery";
import { formatINR } from "@/lib/format";
import { useEditableErrors } from "@/lib/use-editable-errors";
import { useFormSubmit } from "@/lib/use-form-submit";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Props = {
  subtotalPaise: number;
  defaultShippingPaise: number;
  itemCount: number;
  codMaxValue: number;
  whatsapp: string;
};

const ONLINE_READY = false; // Razorpay (UPI / card) arrives in Phase 6.

export function CheckoutForm({
  subtotalPaise,
  defaultShippingPaise,
  itemCount,
  codMaxValue,
  whatsapp,
}: Props) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, placing] = useActionState<CheckoutState, FormData>(placeOrderAction, {});
  const submit = useFormSubmit(formAction);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>();
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [checking, startCheck] = useTransition();
  const lastChecked = useRef("");
  // Result of the live PIN code check; kept apart from form errors so it never re-shows fixed fields.
  const [pinCheck, setPinCheck] = useState<{ error: string | null; filledCity: boolean } | null>(null);

  const [baseErrors, markEdited] = useEditableErrors(localErrors ?? state.errors);
  const errors = withPinCheck(baseErrors, pinCheck);
  const shippingPaise = quote?.ok ? quote.shippingPaise : defaultShippingPaise;
  const totalPaise = subtotalPaise + shippingPaise;
  const rupees = (p: number) => formatINR(p / 100);

  function errorText(code: string) {
    if (code === "codUnavailable" && quote?.ok && quote.codReason === "maxValue") {
      return t("errors.codMaxValue", { max: formatINR(codMaxValue) });
    }
    if (code === "cartChanged" || code === "outOfStock")
      return t(`errors.${code}`, { detail: state.detail ?? "" });
    return t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.invalid");
  }

  function fieldError(name: string) {
    const code = errors?.[name];
    if (!code) return null;
    return (
      <p id={`co-${name}-error`} className="text-danger mt-1 text-sm">
        {errorText(code)}
      </p>
    );
  }

  function checkPincode(value: string) {
    const code = value.trim();
    if (!/^\d{6}$/.test(code) || code === lastChecked.current) return;
    lastChecked.current = code;
    startCheck(async () => {
      const result = await checkPincodeAction(code);
      setQuote(result);
      // Pre-fill the city from our delivery list when the customer hasn't typed one.
      const city = formRef.current?.elements.namedItem("city") as HTMLInputElement | null;
      const fillCity = Boolean(result.ok && result.city && city && !city.value);
      if (fillCity && city && result.ok && result.city) city.value = result.city;
      setPinCheck({ error: result.ok ? null : result.reason, filledCity: fillCity });
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const result = checkoutSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.success) {
      event.preventDefault();
      const found: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        found[key] ??= /^[a-zA-Z]+$/.test(issue.message) ? issue.message : "invalid";
      }
      setLocalErrors(found);
      formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    if (quote && !quote.ok) {
      event.preventDefault();
      setLocalErrors({ pincode: quote.reason });
      return;
    }
    setLocalErrors(undefined);
    submit(event);
  }

  const field = (name: string, label: string, input: React.ReactNode) => (
    <div>
      <Label htmlFor={`co-${name}`}>{label}</Label>
      {input}
      {fieldError(name)}
    </div>
  );
  const inputProps = (name: string) => ({
    id: `co-${name}`,
    name,
    "aria-invalid": Boolean(errors?.[name]),
    "aria-describedby": errors?.[name] ? `co-${name}-error` : undefined,
    className: cn(errors?.[name] && "border-danger"),
  });

  const codDisabled = quote?.ok === true && !quote.codAvailable;
  const notServiceable = errors?.pincode === "notServiceable";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onChange={markEdited}
      noValidate
      className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("delivery")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {field(
            "name",
            t("name"),
            <Input
              {...inputProps("name")}
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              maxLength={80}
            />,
          )}
          {field(
            "mobile",
            t("mobile"),
            <Input
              {...inputProps("mobile")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder={t("mobilePlaceholder")}
              maxLength={16}
            />,
          )}
          {field(
            "address",
            t("address"),
            <textarea
              {...inputProps("address")}
              rows={3}
              autoComplete="street-address"
              placeholder={t("addressPlaceholder")}
              maxLength={300}
              className={cn(
                "border-border focus:border-brand-600 focus:ring-brand-200 w-full rounded-md border bg-white px-3 py-2 text-base focus:ring-2 focus:outline-none",
                errors?.address && "border-danger",
              )}
            />,
          )}
          <div className="grid grid-cols-2 gap-3">
            {field(
              "city",
              t("city"),
              <Input
                {...inputProps("city")}
                autoComplete="address-level2"
                placeholder={t("cityPlaceholder")}
                maxLength={60}
              />,
            )}
            {field(
              "pincode",
              t("pincode"),
              <Input
                {...inputProps("pincode")}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder={t("pincodePlaceholder")}
                maxLength={6}
                onChange={(e) => {
                  if (e.target.value.length === 6) return checkPincode(e.target.value);
                  lastChecked.current = "";
                  setPinCheck(null);
                  setQuote(null);
                }}
                onBlur={(e) => checkPincode(e.target.value)}
              />,
            )}
          </div>
          <p aria-live="polite" className="min-h-5 text-sm">
            {checking ? (
              <span className="text-muted-foreground">{t("checking")}</span>
            ) : quote?.ok ? (
              <span className="text-brand-700 font-medium">
                {t("deliverable", { city: quote.city ? ` — ${quote.city}` : "" })}
                {quote.etaDays ? t("eta", { days: quote.etaDays }) : ""}
              </span>
            ) : null}
          </p>
          {notServiceable && (
            <a
              href={buildWhatsAppLink(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 text-sm font-semibold underline"
            >
              WhatsApp →
            </a>
          )}
          {field("note", t("note"), <Input {...inputProps("note")} maxLength={300} />)}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{t("payment")}</CardTitle>
        </CardHeader>
        <CardContent>
          <fieldset aria-describedby={errors?.paymentMethod ? "co-paymentMethod-error" : undefined}>
            <legend className="sr-only">{t("payment")}</legend>
            <div className="space-y-2">
              {(
                [
                  { value: "UPI", label: t("upi"), icon: QrCode, disabled: !ONLINE_READY },
                  { value: "CARD", label: t("card"), icon: CreditCard, disabled: !ONLINE_READY },
                  { value: "COD", label: t("cod"), icon: Banknote, disabled: codDisabled },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "border-border has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 py-2",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    disabled={option.disabled}
                    defaultChecked={option.value === "COD"}
                    className="accent-brand-700 size-5"
                  />
                  <option.icon className="text-brand-600 size-5" aria-hidden />
                  <span className="flex-1 font-medium">{option.label}</span>
                  {option.value !== "COD" && option.disabled && (
                    <span className="text-muted-foreground text-xs">{t("soon")}</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          {fieldError("paymentMethod")}
          <p className="text-muted-foreground mt-3 text-sm">{t("codHint")}</p>
          {codDisabled && (
            <p role="alert" className="text-danger mt-2 text-sm">
              {errorText("codUnavailable")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>{t("summary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{tc("items")}</dt>
              <dd>{itemCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("subtotal")}</dt>
              <dd>{rupees(subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("shipping")}</dt>
              <dd>{shippingPaise === 0 ? tc("free") : rupees(shippingPaise)}</dd>
            </div>
            <div className="border-border flex justify-between border-t pt-3 text-base font-bold">
              <dt>{t("total")}</dt>
              <dd className="text-brand-800 text-lg">{rupees(totalPaise)}</dd>
            </div>
          </dl>
          {errors?._form && (
            <p role="alert" className="text-danger rounded-md bg-red-50 px-3 py-2 text-sm">
              {errorText(errors._form)}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={placing || checking || codDisabled}>
            {placing ? t("placing") : t("confirm")}
          </Button>
          <p className="text-muted-foreground text-center text-xs">{t("terms")}</p>
        </CardContent>
      </Card>
    </form>
  );
}

/** Overlays the live PIN code check on the form errors. */
function withPinCheck(
  errors: Record<string, string> | undefined,
  pinCheck: { error: string | null; filledCity: boolean } | null,
) {
  if (!pinCheck) return errors;
  const next = { ...errors };
  if (pinCheck.error) next.pincode = pinCheck.error;
  else delete next.pincode;
  if (pinCheck.filledCity) delete next.city;
  return Object.keys(next).length > 0 ? next : undefined;
}
