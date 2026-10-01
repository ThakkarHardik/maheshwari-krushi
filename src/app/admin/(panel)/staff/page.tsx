import { getFormatter, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { setStaffActiveAction } from "./actions";
import { StaffForm } from "./staff-form";

const ERRORS = ["cannotChangeSelf", "lastOwner"] as const;

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdmin("staff:manage");
  const { error } = await searchParams;
  const t = await getTranslations("admin");
  const format = await getFormatter();

  const staff = await db.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true },
  });
  const errorKey = ERRORS.find((e) => e === error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-800 text-2xl font-bold">{t("staff.title")}</h1>
        <p className="text-muted-foreground">{t("staff.subtitle")}</p>
      </div>

      {errorKey && (
        <p role="alert" className="text-danger rounded-md bg-red-50 px-4 py-3 text-sm">
          {t(`staff.${errorKey}`)}
        </p>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-border bg-brand-50 text-brand-800 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("staff.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("staff.email")}</th>
              <th className="px-4 py-3 font-semibold">{t("staff.role")}</th>
              <th className="px-4 py-3 font-semibold">{t("staff.lastLogin")}</th>
              <th className="px-4 py-3 font-semibold">{t("staff.status")}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-border border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  {member.name}{" "}
                  {member.id === admin.id && <span className="text-muted-foreground">{t("staff.you")}</span>}
                </td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3">{t(`roles.${member.role}`)}</td>
                <td className="text-muted-foreground px-4 py-3">
                  {member.lastLoginAt
                    ? format.dateTime(member.lastLoginAt, { dateStyle: "medium", timeStyle: "short" })
                    : t("staff.never")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={member.isActive ? "text-brand-700" : "text-muted-foreground"}>
                      {member.isActive ? t("staff.active") : t("staff.inactive")}
                    </span>
                    {member.id !== admin.id && (
                      <form action={setStaffActiveAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="active" value={String(!member.isActive)} />
                        <button
                          type="submit"
                          className="text-brand-700 text-sm underline-offset-2 hover:underline"
                        >
                          {member.isActive ? t("staff.deactivate") : t("staff.activate")}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("staff.addTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>
    </div>
  );
}
