"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckboxField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { useFormSubmit } from "@/lib/use-form-submit";
import { saveCodAction, savePincodeAction, saveShippingAction, type SettingsState } from "./actions";

const NS = "admin.settings.errors";

function Saved({ state }: { state: SettingsState }) {
  const t = useTranslations("admin.settings");
  if (!state.ok) return null;
  return (
    <p role="status" className="text-brand-700 text-sm font-medium">
      {t("saved")}
    </p>
  );
}

function useSettingsForm(action: (prev: SettingsState, fd: FormData) => Promise<SettingsState>) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(action, {});
  return { state, pending, onSubmit: useFormSubmit(formAction) };
}

export function ShippingForm({
  value,
}: {
  value: { flatCharge: number; freeShippingAbove: number | null; deliverEverywhere: boolean };
}) {
  const t = useTranslations("admin.settings");
  const { state, pending, onSubmit } = useSettingsForm(saveShippingAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="flatCharge"
          label={t("flatCharge")}
          errors={state.errors}
          errorNs={NS}
          inputMode="decimal"
          defaultValue={value.flatCharge}
          required
        />
        <TextField
          name="freeShippingAbove"
          label={t("freeShippingAbove")}
          errors={state.errors}
          errorNs={NS}
          inputMode="decimal"
          defaultValue={value.freeShippingAbove ?? ""}
        />
      </div>
      <CheckboxField
        name="deliverEverywhere"
        label={t("deliverEverywhere")}
        defaultChecked={value.deliverEverywhere}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}

export function CodForm({ value }: { value: { enabled: boolean; maxOrderValue: number } }) {
  const t = useTranslations("admin.settings");
  const { state, pending, onSubmit } = useSettingsForm(saveCodAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <CheckboxField name="enabled" label={t("codEnabled")} defaultChecked={value.enabled} />
      <TextField
        name="maxOrderValue"
        label={t("codMax")}
        errors={state.errors}
        errorNs={NS}
        inputMode="decimal"
        defaultValue={value.maxOrderValue}
        className="max-w-xs"
        required
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}

export type PincodeValues = {
  pincode: string;
  city: string;
  district: string | null;
  deliveryCharge: string | null;
  codAllowed: boolean;
  etaDays: number;
  isActive: boolean;
};

export function PincodeForm({ value }: { value?: PincodeValues }) {
  const t = useTranslations("admin.settings");
  const formRef = useRef<HTMLFormElement>(null);
  const { state, pending, onSubmit } = useSettingsForm(savePincodeAction);
  useEffect(() => {
    if (state.ok && !value) formRef.current?.reset();
  }, [state, value]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <TextField
        name="pincode"
        label={t("pincode")}
        errors={state.errors}
        errorNs={NS}
        inputMode="numeric"
        maxLength={6}
        defaultValue={value?.pincode}
        readOnly={Boolean(value)}
        required
      />
      <TextField
        name="city"
        label={t("city")}
        errors={state.errors}
        errorNs={NS}
        defaultValue={value?.city}
        required
      />
      <TextField
        name="district"
        label={t("district")}
        errors={state.errors}
        errorNs={NS}
        defaultValue={value?.district ?? ""}
      />
      <TextField
        name="deliveryCharge"
        label={t("charge")}
        errors={state.errors}
        errorNs={NS}
        inputMode="decimal"
        placeholder={t("defaultCharge")}
        defaultValue={value?.deliveryCharge ?? ""}
      />
      <TextField
        name="etaDays"
        label={t("eta")}
        errors={state.errors}
        errorNs={NS}
        type="number"
        min={1}
        max={30}
        defaultValue={value?.etaDays ?? 2}
        required
      />
      <CheckboxField name="codAllowed" label={t("codAllowed")} defaultChecked={value?.codAllowed ?? true} />
      <CheckboxField name="isActive" label={t("active")} defaultChecked={value?.isActive ?? true} />
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
        <Button type="submit" disabled={pending}>
          {value ? t("save") : t("addPincode")}
        </Button>
        <Saved state={state} />
      </div>
    </form>
  );
}
