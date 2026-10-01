"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SelectField, TextField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { ADJUSTMENT_TYPES } from "@/lib/inventory/rules";
import { useFormSubmit } from "@/lib/use-form-submit";
import { adjustStockAction, receiveStockAction, type StockFormState } from "../actions";

const ERRORS_NS = "admin.inventory.errors";

function useStockForm(action: (prev: StockFormState, fd: FormData) => Promise<StockFormState>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<StockFormState, FormData>(action, {});
  const onSubmit = useFormSubmit(formAction);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return { formRef, state, pending, onSubmit };
}

function Result({ state, okText }: { state: StockFormState; okText: string }) {
  const t = useTranslations(ERRORS_NS);
  if (state.ok) {
    return (
      <p role="status" className="text-brand-700 text-sm font-medium">
        {okText}
      </p>
    );
  }
  const code = state.errors?._form;
  if (!code) return null;
  return (
    <p role="alert" className="text-danger text-sm">
      {t.has(code) ? t(code) : t("invalid")}
    </p>
  );
}

export function ReceiveStockForm({ variantId }: { variantId: string }) {
  const t = useTranslations("admin.inventory");
  const { formRef, state, pending, onSubmit } = useStockForm(receiveStockAction);
  const errors = state.errors;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <input type="hidden" name="variantId" value={variantId} />
      <TextField
        name="batchNo"
        label={t("batchNoField")}
        errors={errors}
        errorNs={ERRORS_NS}
        maxLength={40}
        required
      />
      <TextField
        name="quantity"
        label={t("quantity")}
        errors={errors}
        errorNs={ERRORS_NS}
        type="number"
        min={1}
        inputMode="numeric"
        required
      />
      <TextField
        name="costPrice"
        label={t("costPrice")}
        errors={errors}
        errorNs={ERRORS_NS}
        inputMode="decimal"
      />
      <TextField
        name="mfgDate"
        label={t("mfgDate")}
        errors={errors}
        errorNs={ERRORS_NS}
        type="date"
        max={today}
      />
      <TextField
        name="expiryDate"
        label={t("expiryDate")}
        errors={errors}
        errorNs={ERRORS_NS}
        type="date"
        min={today}
      />
      <TextField name="supplier" label={t("supplier")} errors={errors} errorNs={ERRORS_NS} maxLength={120} />
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {t("receive")}
        </Button>
        <Result state={state} okText={t("received_ok")} />
      </div>
    </form>
  );
}

export function AdjustStockForm({ batches }: { batches: { id: string; label: string }[] }) {
  const t = useTranslations("admin.inventory");
  const { formRef, state, pending, onSubmit } = useStockForm(adjustStockAction);
  const errors = state.errors;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <SelectField name="batchId" label={t("batch")} errors={errors} errorNs={ERRORS_NS} required>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </SelectField>
      <SelectField name="type" label={t("type")} errors={errors} errorNs={ERRORS_NS} defaultValue="DAMAGE">
        {ADJUSTMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {t(`types.${type}`)}
          </option>
        ))}
      </SelectField>
      <TextField
        name="quantity"
        label={t("quantity")}
        errors={errors}
        errorNs={ERRORS_NS}
        type="number"
        inputMode="numeric"
        hint={t("adjustQtyHint")}
        required
      />
      <TextField
        name="reason"
        label={t("reason")}
        errors={errors}
        errorNs={ERRORS_NS}
        maxLength={300}
        required
      />
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {t("adjust")}
        </Button>
        <Result state={state} okText={t("adjusted")} />
      </div>
    </form>
  );
}
