"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MAX_IMAGE_BYTES } from "@/lib/storage/image";
import { uploadImagesAction, type ImageUploadState } from "../actions";

// Keeps one upload request under the 10 MB server-action limit.
const MAX_REQUEST_BYTES = 9 * 1024 * 1024;

export function ImageUploader({ productId, remaining }: { productId: string; remaining: number }) {
  const t = useTranslations("admin.products.images");
  const [state, formAction, pending] = useActionState<ImageUploadState, FormData>(uploadImagesAction, {});
  const [clientError, setClientError] = useState<string | null>(null);
  const error = clientError ?? state.error;

  function validate(files: FileList | null) {
    if (!files || files.length === 0) return setClientError(null);
    const list = Array.from(files);
    if (list.length > remaining) return setClientError("tooMany");
    if (list.some((f) => f.size > MAX_IMAGE_BYTES)) return setClientError("tooLarge");
    if (list.reduce((sum, f) => sum + f.size, 0) > MAX_REQUEST_BYTES) return setClientError("tooLarge");
    setClientError(null);
  }

  if (remaining <= 0) return <p className="text-muted-foreground text-sm">{t("errors.tooMany")}</p>;

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input
        type="file"
        name="images"
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
        onChange={(e) => validate(e.target.files)}
        className="file:bg-brand-50 file:text-brand-800 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:font-medium"
      />
      <Button type="submit" variant="secondary" disabled={pending || Boolean(clientError)}>
        <Upload /> {pending ? t("uploading") : t("upload")}
      </Button>
      {error && (
        <p role="alert" className="text-danger w-full text-sm">
          {t(`errors.${error}`)}
        </p>
      )}
      {state.ok && !clientError && (
        <p role="status" className="text-brand-700 w-full text-sm">
          {t("uploaded")}
        </p>
      )}
    </form>
  );
}
