import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TrustStrip } from "@/components/store/trust-strip";
import { Button } from "@/components/ui/button";

// Phase 1: hero + trust strip. Featured products are added in Phase 2.
export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <>
      <section className="from-brand-800 via-brand-700 to-brand-600 bg-gradient-to-br text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-xl text-4xl leading-tight font-bold sm:text-5xl">{t("heroTitle")}</h1>
          <p className="text-brand-100 mt-4 text-lg sm:text-xl">{t("heroTagline")}</p>
          <Button asChild variant="accent" size="lg" className="mt-8">
            <Link href="/products">{t("shopNow")}</Link>
          </Button>
        </div>
      </section>

      <section className="border-border bg-brand-50 border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <TrustStrip />
        </div>
      </section>
    </>
  );
}
