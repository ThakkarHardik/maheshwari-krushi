"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { createStaffAction, type CreateStaffState } from "./actions";

export function StaffForm() {
  const t = useTranslations("admin");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<CreateStaffState, FormData>(createStaffAction, {});

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="staff-name">{t("staff.name")}</Label>
        <Input id="staff-name" name="name" required minLength={2} maxLength={80} />
      </div>
      <div>
        <Label htmlFor="staff-email">{t("staff.email")}</Label>
        <Input id="staff-email" name="email" type="email" required autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="staff-role">{t("staff.role")}</Label>
        <Select id="staff-role" name="role" defaultValue="PACKER">
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="staff-password">{t("staff.password")}</Label>
        <Input
          id="staff-password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("staff.adding") : t("staff.add")}
        </Button>
        {state.ok && (
          <p role="status" className="text-brand-700 text-sm">
            {t("staff.added")}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-danger text-sm">
            {t(`staff.${state.error}`)}
          </p>
        )}
      </div>
    </form>
  );
}
