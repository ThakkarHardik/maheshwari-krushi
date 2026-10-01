import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-brand-800 text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-3">{t("body")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
