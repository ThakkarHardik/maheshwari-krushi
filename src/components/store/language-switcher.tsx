"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "hi", label: "हिंदी" },
  { value: "en", label: "EN" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("border-border inline-flex rounded-md border p-0.5 text-sm", className)}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={pending}
          aria-pressed={locale === option.value}
          onClick={() => startTransition(() => setLocale(option.value))}
          className={cn(
            "rounded px-2 py-0.5 font-medium",
            locale === option.value ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-50",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
