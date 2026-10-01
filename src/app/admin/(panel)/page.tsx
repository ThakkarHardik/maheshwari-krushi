import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const admin = await requireAdmin("dashboard:view");
  const { denied } = await searchParams;
  const t = await getTranslations("admin");

  return (
    <div className="space-y-4">
      {denied && (
        <p role="alert" className="text-danger rounded-md bg-red-50 px-4 py-3 text-sm">
          {t("dashboard.denied")}
        </p>
      )}
      <h1 className="text-brand-800 text-2xl font-bold">{t("dashboard.welcome", { name: admin.name })}</h1>
      <p className="text-muted-foreground">{t("dashboard.role", { role: t(`roles.${admin.role}`) })}</p>
      <Card>
        <CardContent className="text-muted-foreground py-6">{t("dashboard.comingSoon")}</CardContent>
      </Card>
    </div>
  );
}
