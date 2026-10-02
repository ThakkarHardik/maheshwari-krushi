"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { submitReviewAction, type ReviewState } from "@/lib/reviews/actions";
import { useEditableErrors } from "@/lib/use-editable-errors";
import { useFormSubmit } from "@/lib/use-form-submit";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("reviews");
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(submitReviewAction, {});
  const submit = useFormSubmit(formAction);
  const [errors, markEdited] = useEditableErrors(state.errors);

  if (state.ok) {
    return (
      <p
        role="status"
        className="bg-brand-50 text-brand-800 flex items-center gap-2 rounded-md px-4 py-3 font-medium"
      >
        <CircleCheck className="size-5" /> {t("thanks")}
      </p>
    );
  }
  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Star /> {t("write")}
      </Button>
    );
  }

  const err = (name: string) =>
    errors?.[name] ? (
      <p id={`rv-${name}-error`} className="text-danger mt-1 text-sm">
        {t(`errors.${errors[name]}`)}
      </p>
    ) : null;

  return (
    <form
      onSubmit={submit}
      onChange={markEdited}
      noValidate
      className="border-border rounded-card space-y-4 border bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-brand-800 text-lg font-semibold">{t("formTitle")}</h3>
          <p className="text-muted-foreground text-sm">{t("onlyBuyers")}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-brand-700 text-sm hover:underline"
        >
          {t("close")}
        </button>
      </div>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="rating" value={rating || ""} />
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t("rating")}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={t("star", { n })}
              onClick={() => setRating(n)}
              className="hover:bg-brand-50 flex size-11 items-center justify-center rounded-md"
            >
              <Star
                className={cn("size-8", n <= rating ? "fill-accent-500 text-accent-500" : "text-gray-300")}
                aria-hidden
              />
            </button>
          ))}
        </div>
        {errors?.rating && rating === 0 && err("rating")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rv-name">{t("name")}</Label>
          <Input
            id="rv-name"
            name="name"
            maxLength={60}
            autoComplete="name"
            aria-invalid={Boolean(errors?.name)}
          />
          {err("name")}
        </div>
        <div>
          <Label htmlFor="rv-mobile">{t("mobile")}</Label>
          <Input
            id="rv-mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            maxLength={16}
            aria-invalid={Boolean(errors?.mobile)}
          />
          {err("mobile")}
        </div>
      </div>
      <div>
        <Label htmlFor="rv-comment">{t("comment")}</Label>
        <textarea
          id="rv-comment"
          name="comment"
          rows={3}
          maxLength={1000}
          placeholder={t("commentPlaceholder")}
          className="border-border focus:border-brand-600 focus:ring-brand-200 w-full rounded-md border bg-white px-3 py-2 text-base focus:ring-2 focus:outline-none"
        />
        {err("comment")}
      </div>
      {errors?._form && (
        <p role="alert" className="text-danger rounded-md bg-red-50 px-3 py-2 text-sm">
          {t(`errors.${errors._form}`)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
