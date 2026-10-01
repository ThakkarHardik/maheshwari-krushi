"use client";

import { useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { EnquiryForm } from "./enquiry-form";

type Props = {
  whatsapp: string;
  /** Called when the dialog opens, so the message can include the current pack size / quantity. */
  getDefaultMessage: () => string;
  productId?: string;
  productName?: string;
  triggerClassName?: string;
  triggerVariant?: ButtonProps["variant"];
  /** Button text; defaults to the dialog title. */
  label?: string;
};

export function EnquiryDialog({
  whatsapp,
  getDefaultMessage,
  productId,
  productName,
  triggerClassName,
  triggerVariant = "accent",
  label,
}: Props) {
  const t = useTranslations("enquiry");
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A fresh key each time it opens resets the form and refreshes the default message.
  const [session, setSession] = useState<{ key: number; message: string } | null>(null);

  function open() {
    setSession({ key: Date.now(), message: getDefaultMessage() });
    dialogRef.current?.showModal();
  }
  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <Button type="button" size="lg" variant={triggerVariant} onClick={open} className={triggerClassName}>
        <MessageCircle /> {label ?? t("title")}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="enquiry-title"
        onClose={() => setSession(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close(); // click on the backdrop
        }}
        className="rounded-card m-auto w-[min(32rem,calc(100vw-2rem))] p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="enquiry-title" className="text-brand-800 text-xl font-bold">
                {t("title")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="hover:bg-muted -m-2 flex size-11 shrink-0 items-center justify-center rounded-md"
            >
              <X className="size-5" />
            </button>
          </div>
          {session && (
            <EnquiryForm
              key={session.key}
              whatsapp={whatsapp}
              defaultMessage={session.message}
              productId={productId}
              productName={productName}
              onDone={close}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
