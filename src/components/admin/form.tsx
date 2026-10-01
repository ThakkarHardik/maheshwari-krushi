"use client";

import { useTranslations } from "next-intl";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Errors = Record<string, string> | undefined;

export function FieldError({ name, errors }: { name: string; errors: Errors }) {
  const t = useTranslations("admin.errors");
  const key = errors?.[name];
  if (!key) return null;
  return (
    <p id={`${name}-error`} className="text-danger mt-1 text-sm">
      {t.has(key) ? t(key) : t("invalid")}
    </p>
  );
}

function describedBy(name: string, errors: Errors) {
  return errors?.[name] ? `${name}-error` : undefined;
}

type FieldProps = { name: string; label: string; errors: Errors; hint?: React.ReactNode; className?: string };

export function TextField({
  name,
  label,
  errors,
  hint,
  className,
  ...props
}: FieldProps & Omit<React.ComponentProps<"input">, "name">) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={Boolean(errors?.[name])}
        aria-describedby={describedBy(name, errors)}
        className={cn(errors?.[name] && "border-danger")}
        {...props}
      />
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      <FieldError name={name} errors={errors} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  errors,
  hint,
  className,
  ...props
}: FieldProps & Omit<React.ComponentProps<"textarea">, "name">) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={4}
        aria-invalid={Boolean(errors?.[name])}
        aria-describedby={describedBy(name, errors)}
        className={cn(
          "border-border focus:border-brand-600 focus:ring-brand-200 w-full rounded-md border bg-white px-3 py-2 text-base focus:ring-2 focus:outline-none",
          errors?.[name] && "border-danger",
        )}
        {...props}
      />
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      <FieldError name={name} errors={errors} />
    </div>
  );
}

export function SelectField({
  name,
  label,
  errors,
  className,
  children,
  ...props
}: FieldProps & Omit<React.ComponentProps<"select">, "name">) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Select
        id={name}
        name={name}
        aria-invalid={Boolean(errors?.[name])}
        aria-describedby={describedBy(name, errors)}
        {...props}
      >
        {children}
      </Select>
      <FieldError name={name} errors={errors} />
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  className,
  ...props
}: { name: string; label: string; className?: string } & Omit<
  React.ComponentProps<"input">,
  "name" | "type"
>) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium", className)}>
      <input type="checkbox" name={name} className="accent-brand-700 size-5" {...props} />
      {label}
    </label>
  );
}

export function FormMessage({ ok, errors }: { ok?: boolean; errors?: Record<string, string> }) {
  const t = useTranslations("admin");
  if (ok) {
    return (
      <p role="status" className="text-brand-700 text-sm font-medium">
        {t("common.saved")}
      </p>
    );
  }
  if (errors && Object.keys(errors).length > 0) {
    const formError = errors._form;
    return (
      <p role="alert" className="text-danger text-sm font-medium">
        {formError && t.has(`errors.${formError}`) ? t(`errors.${formError}`) : t("errors.form")}
      </p>
    );
  }
  return null;
}
