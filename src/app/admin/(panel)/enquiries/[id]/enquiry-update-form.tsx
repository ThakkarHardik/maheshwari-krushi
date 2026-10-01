"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { SelectField, TextAreaField } from "@/components/admin/form";
import { Button } from "@/components/ui/button";
import { useFormSubmit } from "@/lib/use-form-submit";
import { updateEnquiryAction, type EnquiryUpdateState } from "../actions";

const STATUSES = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"] as const;

export function EnquiryUpdateForm({
  id,
  status,
  adminNote,
}: {
  id: string;
  status: (typeof STATUSES)[number];
  adminNote: string | null;
}) {
  const t = useTranslations("admin.enquiries");
  const te = useTranslations("admin.errors");
  const [state, formAction, pending] = useActionState<EnquiryUpdateState, FormData>(updateEnquiryAction, {});
  const onSubmit = useFormSubmit(formAction);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <SelectField name="status" label={t("status")} errors={undefined} defaultValue={status}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        name="adminNote"
        label={t("adminNote")}
        errors={undefined}
        defaultValue={adminNote ?? ""}
        maxLength={2000}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        {state.ok && (
          <p role="status" className="text-brand-700 text-sm">
            {t("saved")}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-danger text-sm">
            {te.has(state.error) ? te(state.error) : te("invalid")}
          </p>
        )}
      </div>
    </form>
  );
}
