import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/store/logo";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.login");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const t = await getTranslations("admin.login");

  return (
    <div className="bg-brand-50 flex min-h-dvh flex-col items-center justify-center px-4">
      <Logo className="mb-6" />
      <Card className="w-full max-w-sm">
        <CardContent className="py-6">
          <h1 className="text-brand-800 text-xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mb-6 text-sm">{t("subtitle")}</p>
          <LoginForm next={next} />
        </CardContent>
      </Card>
      <Link href="/" className="text-brand-700 mt-6 text-sm hover:underline">
        {t("backToStore")}
      </Link>
    </div>
  );
}
