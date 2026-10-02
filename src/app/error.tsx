"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { storeConfig } from "@/config/store";

/** Shown when a page fails unexpectedly. Details go to the server log, never to the visitor. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-brand-800 text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-3">{t("body")}</p>
      <p className="mt-2 font-semibold">+91 {storeConfig.phone}</p>
      {error.digest && <p className="text-muted-foreground mt-2 font-mono text-xs">#{error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </div>
  );
}
